var Daemon = require("./Daemon"),
	util = require("util"),
	Autowire = require("wantsit").Autowire;

var ProcessRPC = function() {
	Daemon.call(this);

	this._config = Autowire;
}
util.inherits(ProcessRPC, Daemon);

ProcessRPC.prototype.afterPropertiesSet = function() {
	process.title = "boss process starter";

	this._start(this._config.process.socket);
}

ProcessRPC.prototype._getApi = function() {
	return ["startProcess"];
}

ProcessRPC.prototype.startProcess = function(callback) {
	callback();
}

module.exports = ProcessRPC;
