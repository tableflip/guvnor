var usage = require("usage");

var ProcessMessageHandler = function() {

};

ProcessMessageHandler.prototype["boss:status"] = function(event) {
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

module.exports = ProcessMessageHandler;