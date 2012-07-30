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

function _signIn(res, username, password) {
    res.contentType("text/json");

    setTimeout(function() {
        api.signin(username, password, function(error, data) {
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

app.get("/api/signin/:username/:password", function(req, res, next) {
    var username = req.params.username;
    var password = req.params.password;

    _signIn(res, username, password);
});

app.post("/api/signin", function(req, res, next) {
    var username = req.body.username;
    var password = req.body.password;

    _signIn(res, username, password);
});

app.listen(process.env.PORT || 3000);
