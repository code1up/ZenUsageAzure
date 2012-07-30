var uuid = require("node-uuid");

function _bob(emailAddress) {
	var response = {
		emailAddress: emailAddress,
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
				alias: null,
				productName: "Zen Lite",
				isUsageAvailable: false
			}
		]
	};

	return response;
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

function _getLocalPart(emailAddress) {
	var at = emailAddress.indexOf("@");
	var localPart = emailAddress.substring(0, at);

	return localPart;	
}

exports.signin = function(emailAddress, password, callback) {
	var localPart = _getLocalPart(emailAddress);
	var response;

	if (localPart === "alice") {
		response = _alice(emailAddress);

	} else if (localPart === "bob") {
		response = _bob(emailAddress);

	} else if (localPart === "carol") {
		response = _carol(emailAddress);

	} else if (localPart === "dave") {
		response = _dave(emailAddress);

	} else if (localPart === "eve") {
		response = _eve(emailAddress);

	} else {
		response = _randy(emailAddress);

	}

	callback(null, response);
};
