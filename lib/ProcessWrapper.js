var path = require("path"),
	LogRedirector = require("./LogRedirector"),
	path = require("path"),
	ProcessCallbacks = require("./ProcessCallbacks");

process.title = process.env.BOSS_PROCESS_NAME;

var outputLog = path.resolve(process.env.BOSS_LOG_DIRECTORY, process.env.BOSS_PROCESS_NAME + "-output.log");
var errorLog = path.resolve(process.env.BOSS_LOG_DIRECTORY, process.env.BOSS_PROCESS_NAME + "-error.log");

var redirector = new LogRedirector(outputLog, errorLog);
redirector.on("ready", function() {
	var script = process.env.BOSS_SCRIPT;

	// set up process actions
	var callbacks = new ProcessCallbacks();

	for(var key in callbacks) {
		process.on[key] = callbacks[key].bind(callbacks);
	}

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

	process.nextTick(function() {
		process.send({type: "process:ready"});

		// this will execute the passed script
		require(script);
	});
});
