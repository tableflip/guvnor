var path = require("path"),
	cluster = require("cluster"),
	ProcessWrapper = require("./ProcessWrapper"),
	util = require("util"),
	ClusterMessageHandler = require("./ClusterMessageHandler");

var ClusterManager = function() {
	ProcessWrapper.call(this);

	process.title = "Cluster Master: " + process.title;

	this._workers = [];
	this._messageHandler = new ClusterMessageHandler(this);

	Object.defineProperty(this, "workers", {
		get: function() {
			return this._workers
		}.bind(this)
	});
}
util.inherits(ClusterManager, ProcessWrapper);

ClusterManager.prototype._setUp = function() {
	this._setUpProcessCallbacks();
	this._switchToUserAndGroup();

	var workerCount = parseInt(process.env.BOSS_NUM_PROCESSES, 10);
	delete process.env.BOSS_NUM_PROCESSES;

	if(isNaN(workerCount)) {
		workerCount = 1;
	}

	// Fork workers.
	for (var i = 0; i < workerCount; i++) {
		cluster.fork();
	}

	cluster.on("online", function(worker) {
		console.log("worker", worker.process.pid, "online");

		this._workers.push(worker);
	}.bind(this));
	cluster.on("exit", function(worker, code, signal) {
		console.log("worker", worker.process.pid, "died. code", code, "signal", signal);

		// remove worker from list
		this._workers.splice(this._workers.indexOf(worker), 1);
	}.bind(this));

	// need to defer this until all workers are ready or a timeout occurs
	process.send({type: "process:ready"});
};

module.exports = ClusterManager;
