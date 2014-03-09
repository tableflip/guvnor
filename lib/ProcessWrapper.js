var path = require("path"),
	fs = require("fs"),
	LogRedirector = require("./LogRedirector");

var redirector = new LogRedirector(process.env.BOSS_OUTPUT_LOG, process.env.BOSS_ERROR_LOG);
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

	process.title = script;

	// if we've been told to run as a different user or group (e.g. because they have fewer
	// privileges), switch to that user before importing any third party application code.
	if(process.env.BOSS_RUN_AS_GROUP) {
		process.setgid(process.env.BOSS_RUN_AS_GROUP);
	}

	if(process.env.BOSS_RUN_AS_USER) {
		process.setuid(process.env.BOSS_RUN_AS_USER);
	}

	// remove our properties
	for(var key in process.env) {
		if(key.substr(0, 4) == "BOSS") {
			delete process.env[key];
		}
	}

	process.on("message", function(event) {
		if(event && event.type == "boss:status") {
			process.send({
				type: "process:status",
				status: {
					pid: process.pid,
					uid: process.getuid(),
					gid: process.getgid(),
					title: process.title,
					uptime: process.uptime(),
					memoryUsage: process.memoryUsage()
				}
			});
		}
	});

	process.send({type: "process:ready"});

	process.nextTick(function() {
		// this will execute the passed script
		require(script);
	});
});
