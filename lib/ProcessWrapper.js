var path = require("path"),
	fs = require("fs"),
	LogRedirector = require("./LogRedirector");

var script = process.env.boss.script;

console.info("Changing directory to", path.dirname(script));
process.chdir(path.dirname(script));

var redirector = new LogRedirector(process.env.boss.outputLog, process.env.boss.errorLog);
redirector.on("ready", function() {
	// set up an exception handler
	process.on("uncaughtException", function(error) {
		process.send({
			type : 'uncaughtException',
			stack : error.stack,
			err  : {
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
	if(process.env.boss.run_as_group) {
		process.setgid(process.env.boss.run_as_group);
	}

	if(process.env.boss.run_as_user) {
		process.setuid(process.env.boss.run_as_user);
	}

	process.send("ready");

	process.nextTick(function() {
		// this will execute the passed script
		require(script);
	});
});
