var async = require("async"),
	EventEmitter = require("events").EventEmitter,
	util = require("util"),
	fs = require("fs");

LogRedirector = function(outputLog, errorLog) {
	EventEmitter.call(this);

	this._stdout;
	this._stderr;

	async.parallel([
		function(callback) {
			this._stdout = fs.createWriteStream(outputLog, {
				flags : "a"
			});
			this._stdout.on("open", function() {
				callback();
			});
		}.bind(this),
		function(callback) {
			this._stderr = fs.createWriteStream(errorLog, {
				flags : "a"
			});
			this._stderr.on("open", function() {
				callback();
			});
		}.bind(this)],
		function() {
			process.stderr.write = function(string) {
				this._stderr.write(string);
				process.send({
					type : "log:stderr",
					data : string
				});
			}.bind(this);

			process.stdout.write =  function(string) {
				this._stdout.write(string);
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

module.exports = LogRedirector;
