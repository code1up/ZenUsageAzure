var uuid = require("node-uuid");

function _bob() {
	var response = {
		emailAddress: userName,
		authToken: uuid.v4(),
		clientToken: uuid.v4(),
		services: [
			{
				userName: "zen293582@zen",
				alias: "Home",
				productName: "Zen Fibre Active",
				isUsageAvailable: true
			},
			{
				userName: "zen980372@zen",
				alias: "London Office",
				productName: "Zen Fibre Office",
				isUsageAvailable: true
			},
			{
				userName: "zen794632@zen",
				alias: "Manchester Office",
				productName: "Zen Office Max",
				isUsageAvailable: true
			},
			{
				userName: "zen794632@zen",
				alias: "Manchester Office",
				productName: "Zen Lite",
				isUsageAvailable: false
			}
		]
	};

	return response;
}

function _getLocalPart(emailAddress) {
	var at = emailAddress.indexOf("@");
	var localPart = username.substring(0, at);

	return localPart;	
}

function _getRandomProduct() {
	var products = [
		{
			name: "Zen Pro",
			allowance: 200
		},
		{
			name: "Zen Active",
			allowance: 100
		},
		{
			name: "Zen Lite",
			allowance: 20
		},
		{
			name: "Zen Office Max",
			allowance: 2000
		},
		{
			name: "Zen Office",
			allowance: 400
		},
		{
			name: "Zen Fibre Lite",
			allowance: 20
		},
		{
			name: "Zen Fibre Active",
			allowance: 100
		},
		{
			name: "Zen Fibre Pro",
			allowance: 200
		},
		{
			name: "Zen Fibre Office",
			allowance: 400
		},
		{
			name: "Zen Fibre Office Plus",
			allowance: 1000
		}
	];

	var index = Math.random() * products.length;

	return products[index];
}

exports.signin = function(emailAddress, password, callback) {
	var localPart = _getLocalPart(emailAddress);
	var response;

	if (localpart === "alice") {
		response = _alice();

	} else if (localpart === "bob") {
		response = _bob();

	} else if (localpart === "carol") {
		response = _carol();

	} else if (localpart === "dave") {
		response = _dave();

	} else if (localpart === "eve") {
		response = _eve();

	} else {
		response = _randy();

	}

	callback(null, response);
};
