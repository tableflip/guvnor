var path = require("path"),
	cluster = require("cluster"),
	ProcessWrapper = require("./ProcessWrapper"),
	util = require("util");

var ClusterManager = function() {
	ProcessWrapper.call(this);

	process.title = "Cluster Master: " + process.title;
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

	// store workers so we can send them messages
	var workers = [];

	// Fork workers.
	for (var i = 0; i < workerCount; i++) {
		cluster.fork();
	}

	cluster.on("online", function(worker) {
		console.log("worker", worker.process.pid, "online");

		workers.push(worker);
	});
	cluster.on("exit", function(worker, code, signal) {
		console.log("worker", worker.process.pid, "died. code", code, "signal", signal);

		// remove worker from list
		workers.splice(workers.indexOf(worker), 1);
	});

	// need to defer this until all workers are ready or a timeout occurs
	process.send({type: "process:ready"});
};

module.exports = ClusterManager;
