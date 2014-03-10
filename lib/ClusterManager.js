var path = require("path"),
	LogRedirector = require("./LogRedirector"),
	cluster = require("cluster"),
	async = require("async"),
	path = require("path"),
	usage = require("usage");

process.title = process.env.BOSS_PROCESS_NAME;

if(cluster.isMaster) {
	process.title = "Cluster Master: " + process.title;
}

var outputLog = path.resolve(process.env.BOSS_LOG_DIRECTORY, process.env.BOSS_PROCESS_NAME + "-output.log");
var errorLog = path.resolve(process.env.BOSS_LOG_DIRECTORY, process.env.BOSS_PROCESS_NAME + "-error.log");

var redirector = new LogRedirector(outputLog, errorLog);
redirector.on("ready", function() {
	var script = process.env.BOSS_SCRIPT;

	// set up an exception handler
	process.on("uncaughtException", function(error) {
		process.send({
			type : "uncaughtException",
			error  : {
				type: error.type,
				stack: error.stack,
				arguments: error.arguments,
				message: error.message
			}
		});

		if(process.listeners("uncaughtException").length == 1) {
			process.nextTick(function() {
				process.exit(1);
			});
		}
	});

	// if we've been told to run as a different user or group (e.g. because they have fewer
	// privileges), switch to that user before importing any third party application code.
	if(process.env.BOSS_RUN_AS_GROUP) {
		process.setgid(process.env.BOSS_RUN_AS_GROUP);
	}

	if(process.env.BOSS_RUN_AS_USER) {
		process.setuid(process.env.BOSS_RUN_AS_USER);
	}

	process.on("message", function(event) {
		if(event && event.type == "boss:status") {
			usage.lookup(process.pid, {keepHistory: true}, function(err, result) {
				process.send({
					type: "process:status",
					status: {
						pid: process.pid,
						uid: process.getuid(),
						gid: process.getgid(),
						title: process.title,
						uptime: process.uptime(),
						usage: {
							memory: process.memoryUsage(),
							cpu: result.cpu
						}
					}
				});
			});
		}
	});

	if(cluster.isWorker) {
		// remove our properties
		for(var key in process.env) {
			if(key.substr(0, 4) == "BOSS") {
				delete process.env[key];
			}
		}

		process.nextTick(function() {
			// this will execute the passed script
			require(script);
		});

		return;
	}

	var workerCount = parseInt(process.env.BOSS_NUM_PROCESSES, 10);

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
});
