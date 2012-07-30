/*
 * Node.js
 */
var path = require("path");
var util = require("util");

/*
 * Application-specific
 */
var api = require("./api/usage.js");

/*
 * Express
 */
var express = require("express");
var app = express.createServer();
var rootPath = path.join(__dirname, "webapp");

app.use(express["static"](rootPath)); // TODO: avoid reserved word 'static'
app.use(express.bodyParser());

function _signIn(res, userName, password) {
    res.contentType("text/json");

    setTimeout(function() {
        api.signIn(userName, password, function(error, data) {
            if (error) {
                console.log(util.inspect(error));
                res.send(error, 500);
            } else {
                console.log(util.inspect(data));
                res.send(data, 200);
            }
        });
    }, 0);
}

function _getUsage(res, userName, password, serviceUserName) {
    res.contentType("text/json");

    setTimeout(function() {
        api.getUsage(userName, password, serviceUserName, function(error, data) {
            if (error) {
                console.log(util.inspect(error));
                res.send(error, 500);
            } else {
                console.log(util.inspect(data));
                res.send(data, 200);
            }
        });
    }, 0);
}

app.get("/", function(req, res) {
    res.send("/", 404);
});

app.get("/api/signin/:userName/:password", function(req, res, next) {
    var userName = req.params.userName;
    var password = req.params.password;

    _signIn(res, userName, password);
});

app.post("/api/signin", function(req, res, next) {
    var userName = req.body.userName;
    var password = req.body.password;

    _signIn(res, userName, password);
});

app.get("/api/usage/:userName/:password/:serviceUserName", function(req, res, next) {
    var userName = req.params.userName;
    var password = req.params.password;
    var serviceUserName = req.params.serviceUserName;

    _getUsage(res, userName, password, serviceUserName);
});

// TODO: generally, rationalize POST and GET.

app.post("/api/usage/:userName/:password/:serviceUserName", function(req, res, next) {
    var userName = req.params.userName;
    var password = req.params.password;
    var serviceUserName = req.params.serviceUserName;

    _getUsage(res, userName, password, serviceUserName);
});

app.listen(process.env.PORT || 3000);
