var Daemon = require("./Daemon"),
	util = require("util"),
	Autowire = require("wantsit").Autowire,
	child_process = require("child_process"),
	path = require("path"),
	async = require("async")

var BossRPC = function() {
	Daemon.call(this);

	this._config = Autowire;
	this._processes = []; // Started child processes

	// shut down all managed processes on exit
	process.on("exit", function() {
		this._processes.forEach(function(process) {
			process.kill();
		});
	}.bind(this));

	process.on("message", function(message) {
		console.info("incoming message", message);
	});
}
util.inherits(BossRPC, Daemon);

BossRPC.prototype.afterPropertiesSet = function() {
	process.title = "boss";

	this._start(this._config.boss.socket, this._config.boss.infolog, this._config.boss.errorlog);
}

BossRPC.prototype._getApi = function() {
	return ["startProcess", "stopProcess", "listProcesses", "setClusterWorkers"];
}

BossRPC.prototype._findProcess = function(pid) {
	return this._processes.reduce(function(previousValue, currentValue) {
		if(currentValue.pid == pid) {
			return currentValue;
		}

		return previousValue;
	});
}

BossRPC.prototype.startProcess = function(script, options, callback) {
	var starter,
		processReady = false;

	var opts = {
		silent: false,
		detached: true,
		cwd: path.dirname(script),
		stdio: "ignore",
		env: {
			BOSS_SCRIPT: script,
			BOSS_LOG_DIRECTORY: this._config.logging.directory,
			BOSS_PROCESS_NAME: options.name ? options.name : path.basename(script),
			BOSS_RUN_AS_USER: options.user || process.getuid(),
			BOSS_RUN_AS_GROUP: options.group || process.getgid()
		}
	};

	if(options.instances && options.instances > 1) {
		console.info("Starting new cluster");
		opts.env.BOSS_NUM_PROCESSES = options.instances;
		starter = child_process.fork(path.resolve(__dirname, "./cluster"), opts);
		starter.cluster = true;
	} else {
		console.info("Starting new process");
		starter = child_process.fork(path.resolve(__dirname, "./process"), opts);
		starter.cluster = false;
	}

	starter.on("message", function(event) {
		if(event.type == "process:ready") {
			console.info("Child process", script, "ready");
			processReady = true;
			this._processes.push(starter);
			callback();
		} else if(event.type == "process:uncaughtexception") {
			if(!processReady) {
				callback(event.error);
			}
			console.error(event.error);
		}
	}.bind(this));

	starter.on("exit", function(code, signal) {
		console.info("Child process", script, "exited with code", code, "and signal", signal);
		this._processes.splice(this._processes.indexOf(starter), 1);
	}.bind(this));

	starter.on("error", function(error) {
		if(!processReady) {
			callback(error);
		}

		console.error(error);

		var procIndex = this._processes.indexOf(starter);

		if(procIndex > -1) {
			this._processes.splice(procIndex, 1);
		}
	}.bind(this));
}

BossRPC.prototype.stopProcess = function(pid, options, callback) {
	console.info("stopping", pid);

	var process = this._findProcess(pid);

	if(!process) {
		console.info("no process", pid);
		return callback(new Error("There is no process with the pid " + pid));
	}

	console.info("killing", process.pid);
	process.kill();

	callback();
}

BossRPC.prototype.setClusterWorkers = function(id, workers, callback) {
	var process = this._findProcess(name);

	if(!process) {
		return callback(new Error("There is no process with the pid " + pid));
	}

	if(!process.cluster) {
		return callback(new Error(name + " is not a cluster"));
	}

	process.send({type: "boss:numworkers", workers: workers});

	callback();
}

BossRPC.prototype.listProcesses = function(callback) {
	async.parallel(this._processes.map(function(process) {
		return function(callback) {
			var statusTimeoutId;

			function onMessage(event) {
				if(event && event.type == "process:status") {
					clearTimeout(statusTimeoutId)
					process.removeListener("message", onMessage);
					event.status.id = process.id;
					callback(null, event.status);
				}
			}

			// Listen for a state update
			process.on("message", onMessage);

			// Don't wait forever!
			statusTimeoutId = setTimeout(function() {
				process.removeListener("message", onMessage);
				callback(null, {pid: process.pid});
			}, 5000);

			// Ask the process to report it's state
			process.send({type: "boss:status"});
		};
	}), callback);
}

module.exports = BossRPC;
