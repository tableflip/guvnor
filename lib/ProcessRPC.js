var Daemon = require("./Daemon"),
	util = require("util"),
	Autowire = require("wantsit").Autowire,
	child_process = require("child_process");

var ProcessRPC = function() {
	Daemon.call(this);

	this._config = Autowire;
}
util.inherits(ProcessRPC, Daemon);

ProcessRPC.prototype.afterPropertiesSet = function() {
	process.title = "boss process starter";

	this._start(this._config.process.socket, this._config.process.infolog, this._config.process.errorlog);
}

ProcessRPC.prototype._getApi = function() {
	return ["startProcess"];
}

ProcessRPC.prototype.startProcess = function(script, callback) {
	var starter = child_process.fork(require("./ProcessWrapper"), {
		silent: false,
		detached: true,
		cwd: process.cwd(),
		stdio: "ignore",
		env: {
			boss: {
				script: script,
				outputLog: "/tmp/out",
				errorLog: "/tmp/err"
			}
		}
	});
	starter.once("ready", callback);
}

module.exports = ProcessRPC;
