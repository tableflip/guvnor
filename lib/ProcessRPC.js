var Daemon = require("./Daemon"),
	util = require("util"),
	Autowire = require("wantsit").Autowire,
	child_process = require("child_process"),
	path = require("path");

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

ProcessRPC.prototype.startProcess = function(script, options, callback) {
	var starter = child_process.fork(path.resolve(__dirname, "./ProcessWrapper"), {
		silent: false,
		detached: true,
		cwd: path.dirname(script),
		stdio: "ignore",
		env: {
			BOSS_SCRIPT: script,
			BOSS_OUTPUT_LOG: "/tmp/out",
			BOSS_ERROR_LOG: "/tmp/err"
		}
	});
	starter.on("message", function(event) {
		if(event.type == "process:ready") {
			console.info("process totally ready!");

			callback();
		}
	});
}

module.exports = ProcessRPC;
