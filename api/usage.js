/*
	TODO: could look for soap:Fault for more detail

	{ 'soap:Fault': 
	{ faultcode: 'soap:Server',
		faultstring: 'Server was unable to process request. ---> [Zen.Exceptions.AuthenticationException]: Failed to login to remote server. The provided authentication GUID is invalid or the cache has expired. You should re-authenticate to the web service to request a new authentication GUID and establish a new cache item.',
		detail: {} } }

	TODO: handle HTTP response 500 specifically - user failed to sign in.
*/

var _ = require("underscore");
var request = require("request");
var util = require("util");
var xml2js = require("xml2js");
var usagetest = require("./usagetest");

var _url = "https://webservices.zen.co.uk/broadband/v3.11/serviceengine.asmx";

var _headers = {
	"content-type": 'text/xml; charset="utf-8"'
};

var _template = [
	'<soap:Envelope',
		' xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/"',
		' xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"',
		' xmlns:xsd="http://www.w3.org/2001/XMLSchema"',
		' xmlns:wsa="http://schemas.xmlsoap.org/ws/2004/08/addressing"',
		' xmlns:wsse="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-secext-1.0.xsd"',
		' xmlns:wsu="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-utility-1.0.xsd">',
		'<soap:Header>',
			'<wsa:Action>https://webservices.zen.co.uk/broadbandstatistics/__action__</wsa:Action>',
			'<wsa:MessageID>urn:uuid:97fbd859-2a6e-4bc1-b201-92accf4828c3</wsa:MessageID>',
			'<wsa:ReplyTo>',
				'<wsa:Address>http://schemas.xmlsoap.org/ws/2004/08/addressing/role/anonymous</wsa:Address>',
			'</wsa:ReplyTo>',
			'<wsa:To>https://webservices.zen.co.uk/broadband/v3.11/serviceengine.asmx</wsa:To>',
			'<wsse:Security soap:mustUnderstand="1">',
				'<wsse:UsernameToken wsu:Id="SecurityToken-3e12170e-c6b4-4546-bde6-d6fbfd00cc10">',
					'<wsse:Username>__username__</wsse:Username>',
					'<wsse:Password Type="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-username-token-profile-1.0#PasswordText">__password__</wsse:Password>',
				'</wsse:UsernameToken>',
			'</wsse:Security>',
		'</soap:Header>',
		'<soap:Body>',
			'<__action__ xmlns="https://webservices.zen.co.uk/broadband/v3.11/">',
			'<username>__username__</username>',
			'<password>__password__</password>',
			'__body__',
			'</__action__>',
		'</soap:Body>',
	'</soap:Envelope>'
].join("");

function _isTestRequest(username) {
	var re = /^.*@example.com$/gi;

	return re.test(username);
}

function _makeRequest(template, message, username, password, extra) {
	var bodyString = "";

	// TODO: extra.parameters?!
	if (_.isObject(extra)) {
		var clone = _.clone(extra);

		clone.username = username;
		clone.password = password;

		var keys = _.keys(clone);

		// TODO: replace with Underscore.js templating?
		_.each(keys, function(key) {
			var pre = "<" + key + ">";
			var value = clone[key];
			var post = "</" + key + ">";

			bodyString += pre + _.escape(value) + post;
		});	
	}

	template = template
		.replace(/__action__/mgi, _.escape(message))
		.replace(/__username__/mgi, _.escape(username))
		.replace(/__password__/mgi, _.escape(password))
		.replace(/__body__/mgi, bodyString); // body is already escaped
	
	return template;
}

function _send(message, username, password, extra, callback) {
	var body = _makeRequest(_template, message, username, password, extra);

	request.post({
		url: _url,
		headers: _headers,
		body: body
	}, function(error, data, body) {
		if (error) {
			callback(
				{
					errorMessage: "A network error occurred, please check your Internet connection.",
					internalError: error
				},
				data,
				body
			);
		} else if (!data || !data.statusCode) {
			callback(
				{
					errorMessage: "No data or data status code received."
				},
				data,
				body
			);
		} else if (data.statusCode === 500) {
			callback(
				{
					errorMessage: "Invalid email address or password."
				},
				data,
				body
			);
		} else if (data.statusCode !== 200) {
			callback(
				{
					errorMessage: "Unexpected error occurred with status code " + data.statusCode + "."
				},
				data,
				body
			);
		} else {
			var parser = new xml2js.Parser();

			parser.parseString(data.body, function(error, json) {
				var body = json["soap:Body"];

				callback(null, data, body);
			});
		}
	});
}

exports.getservices = function(username, password, usertoken, clienttoken, callback) {
	var message = "GetAuthorisedBroadbandAccounts";

	var extra = {
		AuthenticationGUID: usertoken,
		ClientValidationGUID: clienttoken
	};		

	_send(message, username, password, extra, function(error, data, body) {
		if (error) {
			callback(error);

		} else {
			var services = body.GetAuthorisedBroadbandAccountsResponse.GetAuthorisedBroadbandAccountsResult;
			
			var response = {
				username: username,
				password: password,
				usertoken: usertoken,
				clienttoken: clienttoken,
				services: []
			};

			_.each(services, function(service) {
				response.services.push({
					username: service.DSLUsername,
					alias: service.AliasName,
					productname: service.ProductName,
					// TODO: returns a string.
					isusageavailable: service.IsUsageInformationAvailable
				});
			});

			callback(null, response);
		}
	});
};

exports.validateclient = function(username, password, usertoken, callback) {
	var message = "ValidateClient"; 
	var version = "0.1";
	var clientName = "ZenPlex";
	var isBeta = true;

	var extra = {
		AuthenticationGUID: usertoken,
		ClientVersion: version,
		ClientName: clientName,
		ClientIsBeta: isBeta
	};

	_send(message, username, password, extra, function(error, data, body) {
		if (error) {
			callback(error);

		} else {
			var clienttoken = body.ValidateClientResponse.ValidateClientResult;

			callback(null, {
				username: username,
				password: password,
				usertoken: usertoken,
				clienttoken: clienttoken
			});
		}
	});
};

exports.signin = function(username, password, callback) {
	var message = "Authenticate";

	var extra = {
		username: username,
		password: password
	};

	var _getServicesHandler = function(error, data) {
		if (error) {
			callback(error);
		} else {
			callback(null, {
				username: data.username,
				usertoken: data.usertoken,
				clienttoken: data.clienttoken,
				services: data.services
			});
		}
	};

	var _validateClientHandler = function(error, data) {
		if (error) {
			callback(error);
		} else {
			exports.getservices(
				data.username,
				data.password,
				data.usertoken,
				data.clienttoken,
				_getServicesHandler);
		}
	};

	var _signInHandler = function(error, data, body) {
		if (error) {
			callback(error);

		} else {
			var usertoken = body.AuthenticateResponse.AuthenticateResult;

			exports.validateclient(
				username,
				password,
				usertoken,
				_validateClientHandler);
		}
	};

	if (_isTestRequest(username)) {
		usagetest.signin(username, password, callback);

	} else {
		_send(message, username, password, extra, _signInHandler);

	}
};
