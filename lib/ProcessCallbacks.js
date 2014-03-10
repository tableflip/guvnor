var usage = require("usage");

var ProcessCallbacks = function() {

};

ProcessCallbacks.prototype.uncaughtException = function(error) {
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
}

ProcessCallbacks.prototype.message = function(event) {
	if(!event || !event.type) {
		return;
	}

	if(event.type == "boss:status") {
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
}

module.exports = ProcessCallbacks;