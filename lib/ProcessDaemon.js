var dnode = require("dnode"),
	child_process = require("child_process"),
	fs = require("fs");

var SOCKET = "/tmp/boss-ps";

var ProcessDaemon = function() {
	//process.title = "Boss Process Launcher";

	process.on("exit", function() {
		if(fs.existsSync(SOCKET)) {
			console.info("Removing socket file");
			fs.unlinkSync(SOCKET);
		}
	});

	process.on("exception", function(err) {
		if(fs.existsSync(SOCKET)) {
			console.info("Removing socket file");
			fs.unlinkSync(SOCKET);
		}

		throw err;
	});

	console.info("starting dnode");

	var api = {};

	this._getApi().forEach(function(method) {
		api[method] = this[method].bind(this);
	}.bind(this));

	// publish RPC methods
	var server = dnode(api);
	server.on("*", function(event) {
		console.info("Got", event);
	});
	server.listen(SOCKET);

	process.send("ps:ready");
}

ProcessDaemon.prototype._getApi = function() {
	return ["getApiMethods", "startProcess"];
}

ProcessDaemon.prototype.getApiMethods = function(callback) {
	callback(this._getApi());
}

ProcessDaemon.prototype.startProcess = function(callback) {
	callback();
}

new ProcessDaemon();
