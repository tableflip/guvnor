var extend = require("extend")

function ProcessInfo(script, process, options) {
	this.script = script;
	this.process = process;
	this.options = extend({
		restartOnError: true,
		restartRetries: 5,
		crashRecoveryPeriod: 5000
	}, options)

	this.restarts = 0;
	this.totalRestarts = 0;
	this._crashRecoveryTimeoutId = null;
}

ProcessInfo.prototype.stillCrashing = function() {
	clearTimeout(this._crashRecoveryTimeoutId);

	this.restarts++;
	this.totalRestarts++;

	// Reset the restart count when process considered not crashing
	this._crashRecoveryTimeoutId = setTimeout(function() {
		console.info("Process recovered");
		this.restarts = 0;
	}.bind(this), this.options.crashRecoveryPeriod);
};

module.exports = ProcessInfo;