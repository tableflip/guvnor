var path = require("path"),
	LogRedirector = require("./LogRedirector"),
	usage = require("usage");

var ProcessWrapper = function() {
	process.title = process.env.BOSS_PROCESS_NAME;

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
	process.on("message", function(event) {
		if(!event || !event.type) {
			return;
		}

		if(this[event.type]) {
			this[event.type](event);
		}
	}.bind(this));
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
		type : "process:uncaughtexception",
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

ProcessWrapper.prototype["boss:status"] = function() {
	usage.lookup(process.pid, {
		keepHistory: true
	}, function(err, result) {
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

module.exports = ProcessWrapper;
