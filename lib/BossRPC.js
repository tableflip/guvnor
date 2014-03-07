var Daemon = require("./Daemon"),
	util = require("util"),
	Autowire = require("wantsit").Autowire;

var BossRPC = function() {
	Daemon.call(this);

	this._config = Autowire;
	this._processStarter = Autowire;

	this._processes = [];
}
util.inherits(BossRPC, Daemon);

BossRPC.prototype.afterPropertiesSet = function() {
	process.title = "boss";

	this._start(this._config.boss.socket);
}

BossRPC.prototype._getApi = function() {
	return ["startProcess", "listProcesses"];
}

BossRPC.prototype.startProcess = function(callback) {
	callback();
}

BossRPC.prototype.listProcesses = function(callback) {
	callback(this._processes);
}

BossRPC.prototype.kill = function() {
	this._processStarter.invoke(function() {
		this._processStarter.kill();

		Daemon.prototype.kill.call(this);
	}.bind(this));
}

module.exports = BossRPC;
