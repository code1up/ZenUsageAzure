exports.signin = function(username, password, callback) {
	callback(null, {
		username: username,
		usertoken: "b4ecbcd3-3914-4eea-9d89-5147d7f89784",
		clienttoken: "f6294bbd-7362-4685-9f71-5100938a0816",
		services: [
			{
				username: "zen123456@zen",
				alias: "Home",
				productname: "Zen Fibre Active",
				// TODO: returns a string.
				isusageavailable: "true"
			},
			{
				username: "zen9876543@zen",
				alias: "Office",
				productname: "Zen Fibre Office",
				// TODO: returns a string.
				isusageavailable: "true"
			}
		]
	});
};
