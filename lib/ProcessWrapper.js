var path = require("path"),
	LogRedirector = require("./LogRedirector"),
	ProcessCallbacks = require("./ProcessCallbacks");

var ProcessWrapper = function() {
	process.title = process.env.BOSS_PROCESS_NAME;

	var redirector = new LogRedirector();
	redirector.on("ready", this._setUp.bind(this));
}

ProcessWrapper.prototype._setUp = function() {
	var script = process.env.BOSS_SCRIPT;

	this._setUpProcessCallbacks();
	this._switchToUserAndGroup();
	this._removeBossPropertiesFromEnvironment();

	process.nextTick(function() {
		process.send({type: "process:ready"});

		// this will execute the passed script
		require(script);
	});
}

ProcessWrapper.prototype._setUpProcessCallbacks = function() {
	// set up process actions
	var callbacks = new ProcessCallbacks();

	for(var key in callbacks) {
		if(callbacks[key] instanceof Function) {
			process.on[key] = callbacks[key].bind(callbacks);
		}
	}
}

ProcessWrapper.prototype._switchToUserAndGroup = function() {
	// if we've been told to run as a different user or group (e.g. because they have fewer
	// privileges), switch to that user before importing any third party application code.
	if(process.env.BOSS_RUN_AS_GROUP) {
		process.setgid(process.env.BOSS_RUN_AS_GROUP);
	}

	if(process.env.BOSS_RUN_AS_USER) {
		process.setuid(process.env.BOSS_RUN_AS_USER);
	}
}

ProcessWrapper.prototype._removeBossPropertiesFromEnvironment = function() {
	// remove our properties
	for(var key in process.env) {
		if(key.substr(0, 4) == "BOSS") {
			delete process.env[key];
		}
	}
}

module.exports = ProcessWrapper;
