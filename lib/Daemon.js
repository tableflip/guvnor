var dnode = require("dnode"),
	fs = require("fs"),
	LogRedirector = require("./LogRedirector");

var Daemon = function(socket) {

}

Daemon.prototype._start = function(socket, infolog, errorlog) {
	this._socket = socket;

	var redirector = new LogRedirector(infolog, errorlog);
	redirector.on("ready", function() {
		process.on("exit", this._cleanUp.bind(this));
		process.on("exception", function(error) {
			this._cleanUp();

			throw error;
		}.bind(this));
		process.on("SIGINT", function() {
			this._cleanUp();

			process.exit(0);
		});

		// publish RPC methods
		var server = dnode(this._generateApi());
		server.listen(this._socket);

		// all done, send our parent process a message
		process.send("daemon:ready");
	}.bind(this));
}

Daemon.prototype._cleanUp = function() {
	if(fs.existsSync(this._socket)) {
		fs.unlinkSync(this._socket);
	}
}

Daemon.prototype._generateApi = function() {
	var api = {};

	["getApiMethods", "kill"].concat(this._getApi()).forEach(function(method) {
		api[method] = this[method].bind(this);
	}.bind(this));

	return api;
}

Daemon.prototype._getApi = function() {
	return [];
}

Daemon.prototype.getApiMethods = function(callback) {
	callback(["getApiMethods", "kill"].concat(this._getApi()));
}

Daemon.prototype.kill = function() {
	process.exit(0);
}

module.exports = Daemon;
