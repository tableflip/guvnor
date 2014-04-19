var async = require("async"),
	EventEmitter = require("events").EventEmitter,
	util = require("util"),
	fs = require("fs"),
	file = require("file"),
	path = require("path");

function LogRedirector(outputLog, errorLog) {
	EventEmitter.call(this);

	if(!outputLog) {
		outputLog = path.resolve(process.env.BOSS_LOG_DIRECTORY, process.env.BOSS_PROCESS_NAME + "-output.log");
	}

	if(!errorLog) {
		errorLog = path.resolve(process.env.BOSS_LOG_DIRECTORY, process.env.BOSS_PROCESS_NAME + "-error.log");
	}

	this._stdout = null;
	this._stderr = null;

	async.parallel([
		function(callback) {
			this._stdout = this._createLogFile(outputLog, callback);
		}.bind(this),
		function(callback) {
			this._stderr = this._createLogFile(errorLog, callback);
		}.bind(this)
		],
		function() {
			process.stderr.write = function(string) {
				this._stderr.write(string);

				if(!process.connected) {
					return;
				}

				process.send({
					type : "log:stderr",
					data : string
				});
			}.bind(this);

			process.stdout.write =  function(string) {
				this._stdout.write(string);

				if(!process.connected) {
					return;
				}

				process.send({
					type : "log:stdout",
					data : string
				});
			}.bind(this);

			this.emit("ready");
		}.bind(this)
	);
}
util.inherits(LogRedirector, EventEmitter);

LogRedirector.prototype._createLogFile = function(logFile, callback) {
	var directory = path.dirname(logFile);

	try {
		file.mkdirsSync(directory);
	} catch(e) {
		process.send({type: "daemon:fatality", message: "I tried to make a directory: " + directory + " but I couldn't. Please ensure that I am run as a user with sufficient permissions."});
	}

	var stream = fs.createWriteStream(logFile, {
		flags : "a"
	});
	stream.on("open", function() {
		callback();
	});
	stream.on("error", function(error) {
		process.send({type: "daemon:fatality", message: "I tried to make a log file: " + logFile + " but I couldn't. Please ensure that I am run as a user with sufficient permissions."});
	});

	return stream;
}

module.exports = LogRedirector;
