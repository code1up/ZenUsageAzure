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

function _isTestRequest(emailAddress) {
	var re = /^.*@example.com$/gi;

	return re.test(emailAddress);
}

function _makeRequest(template, message, emailAddress, password, extra) {
	var bodyString = "";

	// TODO: extra.parameters?!
	if (_.isObject(extra)) {
		var clone = _.clone(extra);

		clone.emailAddress = emailAddress;
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
		.replace(/__username__/mgi, _.escape(emailAddress))
		.replace(/__password__/mgi, _.escape(password))
		.replace(/__body__/mgi, bodyString); // body is already escaped
	
	return template;
}

function _send(message, emailAddress, password, extra, callback) {
	var body = _makeRequest(_template, message, emailAddress, password, extra);

	request.post({
		url: _url,
		headers: _headers,
		body: body
	}, function(error, data, body) {
		var errorMessage;
		var internalError;

		if (error) {
			errorMessage = "A network error occurred, please check your Internet connection.";
			internalError = error;

		} else if (!data || !data.statusCode) {
			errorMessage = "Neither data nor data status code received.";

		} else if (data.statusCode === 500) {
			errorMessage = "Invalid email address or password.";

		} else if (data.statusCode !== 200) {
			errorMessage = "Unexpected error occurred with status code " + data.statusCode + ".";
			
		} else {
			var parser = new xml2js.Parser();

			parser.parseString(data.body, function(error, json) {
				var body = json["soap:Body"];

				callback(null, data, body);
			});
		}

		if (errorMessage || internalError) {
			callback({
				status: "ERROR",
				errorMessage: errorMessage || "Internal error.",
				internalError: internalError
			},
			data,
			body);
		}
	});
}

exports.getservices = function(emailAddress, password, authToken, clientToken, callback) {
	var message = "GetAuthorisedBroadbandAccounts";

	var extra = {
		AuthenticationGUID: authToken,
		ClientValidationGUID: clientToken
	};		

	_send(message, emailAddress, password, extra, function(error, data, body) {
		if (error) {
			callback(error);

		} else {
			var services = body.GetAuthorisedBroadbandAccountsResponse.GetAuthorisedBroadbandAccountsResult;
			
			var response = {
				status: "OK",
				emailAddress: emailAddress,
				password: password,
				authToken: authToken,
				clientToken: clientToken,
				services: []
			};

			_.each(services, function(service) {
				response.services.push({
					userName: service.DSLUsername,
					alias: service.AliasName,
					productName: service.ProductName,
					isUsageAvailable: (service.IsUsageInformationAvailable === "true")
				});
			});

			callback(null, response);
		}
	});
};

exports.validateclient = function(emailAddress, password, authToken, callback) {
	var message = "ValidateClient"; 
	var version = "0.1";
	var clientName = "ZenPlex";
	var isBeta = true;

	var extra = {
		AuthenticationGUID: authToken,
		ClientVersion: version,
		ClientName: clientName,
		ClientIsBeta: isBeta
	};

	_send(message, emailAddress, password, extra, function(error, data, body) {
		if (error) {
			callback(error);

		} else {
			var clientToken = body.ValidateClientResponse.ValidateClientResult;

			callback(null, {
				emailAddress: emailAddress,
				password: password,
				authToken: authToken,
				clientToken: clientToken
			});
		}
	});
};

exports.signin = function(emailAddress, password, callback) {
	var message = "Authenticate";

	var extra = {
		emailAddress: emailAddress,
		password: password
	};

	var _getServicesHandler = function(error, data) {
		if (error) {
			callback(error);
		} else {
			callback(null, data);
		}
	};

	var _validateClientHandler = function(error, data) {
		if (error) {
			callback(error);
		} else {
			exports.getservices(
				data.emailAddress,
				data.password,
				data.authToken,
				data.clientToken,
				_getServicesHandler);
		}
	};

	var _signInHandler = function(error, data, body) {
		if (error) {
			callback(error);

		} else {
			var authToken = body.AuthenticateResponse.AuthenticateResult;

			exports.validateclient(
				emailAddress,
				password,
				authToken,
				_validateClientHandler);
		}
	};

	if (_isTestRequest(emailAddress)) {
		usagetest.signin(emailAddress, password, callback);

	} else {
		_send(message, emailAddress, password, extra, _signInHandler);

	}
};
