var dnode = require("dnode"),
	fs = require("fs"),
	EventEmitter = require("events").EventEmitter,
	util = require("util"),
	Autowire = require("wantsit").Autowire,
	child_process = require("child_process"),
	path = require("path");

var ProcessStarter = function() {
	EventEmitter.call(this);

	this._config = Autowire;
}
util.inherits(ProcessStarter, EventEmitter);

ProcessStarter.prototype.afterPropertiesSet = function() {
	if (this._daemonIsRunning()) {
		// we are parent
		this._connectToDaemon();
	} else {
		this.once("daemonrunning", this._connectToDaemon.bind(this));
		this._startDaemon();
	}
}

ProcessStarter.prototype._startDaemon = function() {
	var starter = child_process.fork(path.resolve(__dirname, "ProcessDaemon"), {
		silent: false,
		detached: true,
		cwd: process.cwd(),
		stdio: "ignore"
	}, function(error, stdout, stderr) {
		if(error) {
			console.error(error);
		}
	});
	starter.once("message", function() {
		console.info("Process Launcher ready");
		this.emit("daemonrunning");
	}.bind(this));
	starter.unref();

	console.info("Process Launcher forked");
}

ProcessStarter.prototype._connectToDaemon = function() {
	console.info("Connecting to Launcher");
	var remote = dnode.connect(this._config.socket);
	remote.on("remote", function (remote) {
		console.info("Connected to remote!");

		remote.getApiMethods(function(methods) {
			methods.forEach(function(method) {
				console.info("API method", method);
				this[method] = remote[method];
			});
		}.bind(this));
	}.bind(this));
}

ProcessStarter.prototype._daemonIsRunning = function() {
	return fs.existsSync(this._config.socket);
}

module.exports = ProcessStarter;
