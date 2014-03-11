var path = require("path"),
	LogRedirector = require("./LogRedirector"),
	ProcessMessageHandler = require("./ProcessMessageHandler");

var ProcessWrapper = function() {
	process.title = process.env.BOSS_PROCESS_NAME;

	this._messageHandler = new ProcessMessageHandler();

	var redirector = new LogRedirector();
	redirector.once("ready", this._setUp.bind(this));
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
	process.on("uncaughtException", this._onUncaughtException.bind(this));
	process.on("message", this._onMessage.bind(this));
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

ProcessWrapper.prototype._onUncaughtException = function(error) {
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

ProcessWrapper.prototype._onMessage = function(event) {
	if(!event || !event.type) {
		return;
	}

	if(this._messageHandler[event.type]) {
		this._messageHandler[event.type].apply(this._messageHandler, arguments);
	}
}

module.exports = ProcessWrapper;
