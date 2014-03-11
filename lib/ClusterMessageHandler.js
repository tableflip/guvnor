var usage = require("usage"),
	ProcessMessageHandler = require("./ProcessMessageHandler"),
	util = require("util");

var ClusterMessageHandler = function(clusterManager) {
	ProcessMessageHandler.call(this);

	this._manager = clusterManager;
};
util.inherits(ClusterMessageHandler, ProcessMessageHandler);

ClusterMessageHandler.prototype["boss:status"] = function(event) {
	ProcessMessageHandler["boss:status"].call(this);

	this._manager.workers.forEach(function(worker) {
		worker.send("boss:status");
	});
}

module.exports = ClusterMessageHandler;
