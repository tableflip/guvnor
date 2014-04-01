var Daemon = require("./Daemon"),
	util = require("util"),
	Autowire = require("wantsit").Autowire,
	child_process = require("child_process"),
	path = require("path"),
	async = require("async"),
	extend = require("extend"),
	RestartedProcess = require("./RestartedProcess");

var BossRPC = function() {
	Daemon.call(this);

	this._config = Autowire;
	this._processes = {}; // {pid: process}
	this._restartedProcesses = {}; // {pid: process restart data}

	// shut down all managed processes on exit
	process.on("exit", function() {
		console.info("Shutting down");
		Object.keys(this._processes).forEach(function(pid) {
			console.info("Killing", pid);
			this._processes[pid].kill();
		}, this);
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

/**
 * Start a new NodeJS process
 *
 * @param {String} script The path to the NodeJS script to start
 * @param {Object} options
 * @param {Number} [options.instances] The number of instances to start (1)
 * @param {String} [options.name] Name to give the process (script filename)
 * @param {String|Number} [options.user] User name or uid to start the process as (current user)
 * @param {String|Number} [options.group] Group name or gid to start the process as (current group)
 * @param {Boolean} [options.restartOnError] Restart the process automatically when it exits abnormally (true)
 * @param {Number} [options.restartRetries] Number of times the process can be restarted when crashing (5)
 * @oaram {Number} [options.crashRecoveryPeriod] The time before the process is considered to not be crashing (5000ms)
 * @param {Function} callback Called on successful process start or on startup error
 * @returns {Number} PID of the process that was started
 */
BossRPC.prototype.startProcess = function(script, options, callback) {
	var starter;

	var opts = {
		silent: true,
		detached: true,
		cwd: path.dirname(script),
		env: {
			BOSS_SCRIPT: script,
			BOSS_LOG_DIRECTORY: this._config.logging.directory,
			BOSS_PROCESS_NAME: options.name ? options.name : path.basename(script),
			BOSS_RUN_AS_USER: options.user || process.getuid(),
			BOSS_RUN_AS_GROUP: options.group || process.getgid()
		}
	};

	if(options.instances && options.instances > 1) {
		console.info("Starting new cluster", script);
		opts.env.BOSS_NUM_PROCESSES = options.instances;
		starter = child_process.fork(path.resolve(__dirname, "./cluster"), opts);
		starter.cluster = true;
	} else {
		console.info("Starting new process", script);
		starter = child_process.fork(path.resolve(__dirname, "./process"), opts);
		starter.cluster = false;
	}

	starter.ready = false;

	starter.on("message", function(event) {
		if(event.type == "process:ready") {
			console.info("Child process", script, "ready");
			starter.ready = true;
			callback(null, starter.pid);
		} else if(event.type == "process:uncaughtexception") {
			console.error(event.error);
		}
	}.bind(this));

	// Note that the exit-event may or may not fire after an error has occured.
	// http://nodejs.org/api/child_process.html#child_process_event_error

	starter.on("exit", function(code, signal) {
		console.info("Child process", script, starter.pid, "exited with code", code, "and signal", signal);

		if(this._processes[starter.pid]) {
			if(!starter.ready) {
				callback(new Error("Child process exited with code " + code + " before it was ready"));
			}

			if(code === null || code > 0) {
				this._restartProcess(starter.pid, script, options);
			}
		}
	}.bind(this));

	starter.on("error", function(error) {
		console.error("Child process", script, "emitted error event", error);

		if(this._processes[starter.pid]) {
			if(!starter.ready) {
				callback(error);
			}

			this._restartProcess(starter.pid, script, options);
		}
	}.bind(this));

	this._processes[starter.pid] = starter;

	return starter.pid;
}

/**
 * Restart a failed process, provided it is configured to be restarted, and hasn't errd too many times.
 */
BossRPC.prototype._restartProcess = function(failedPid, script, options) {
	options = extend({
		restartOnError: true,
		restartRetries: 5,
		crashRecoveryPeriod: 5000
	}, options);

	if(options.restartOnError) {
		var restartedProc = this._restartedProcesses[failedPid];

		if(!restartedProc) {
			restartedProc = new RestartedProcess(options.crashRecoveryPeriod);
		}

		restartedProc.stillCrashing();

		if(restartedProc.restarts < options.restartRetries) {
			console.info("Restarting process", script, failedPid, "x", restartedProc.restarts);

			var pid = this.startProcess(script, options, function(error) {
				if(error) {
					return console.error("Failed to restart process", script, failedPid, error);
				}
				console.info("Restarted process", script, failedPid, "as", pid);
			});

			this._restartedProcesses[pid] = restartedProc;
		}
	}

	delete this._processes[failedPid];
	delete this._restartedProcesses[failedPid];
}

BossRPC.prototype.stopProcess = function(pid, options, callback) {
	console.info("stopping", pid);

	var process = this._processes[pid];

	if(!process) {
		console.info("no process", pid);
		return callback(new Error("There is no process with the pid " + pid));
	}

	console.info("killing", pid);
	process.kill();

	delete this._processes[pid];
	delete this._restartedProcesses[pid];

	callback();
}

BossRPC.prototype.setClusterWorkers = function(pid, workers, callback) {
	var process = this._processes[pid];

	if(!process) {
		return callback(new Error("There is no process with the pid " + pid));
	}

	if(!process.options.cluster) {
		return callback(new Error(pid + " is not a cluster"));
	}

	process.send({type: "boss:numworkers", workers: workers});

	callback();
}

BossRPC.prototype.listProcesses = function(callback) {
	var procList = Object.keys(this._processes).map(function(pid) {
		return this._processes[pid];
	}, this);

	async.parallel(procList.map(function(process) {
		return function(callback) {
			var statusTimeoutId;

			function onMessage(event) {
				if(event && event.type == "process:status") {
					clearTimeout(statusTimeoutId);
					process.removeListener("message", onMessage);
					event.status.id = process.id;
					callback(null, event.status);
				}
			}

			// Listen for a state update
			process.on("message", onMessage);

			// Don't wait forever!
			statusTimeoutId = setTimeout(function() {
				console.warn("Timeout requesting status for process", process.pid);
				process.removeListener("message", onMessage);
				callback(null, {pid: process.pid});
			}, 5000);

			console.info("Requesting status for process", process.pid);

			// Ask the process to report it's state
			process.send({type: "boss:status"});
		};
	}), callback);
}

module.exports = BossRPC;
