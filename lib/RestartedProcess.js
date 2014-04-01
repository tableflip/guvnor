function RestartedProcess(crashRecoveryPeriod) {
	this.restarts = 0;
	this.crashRecoveryPeriod = crashRecoveryPeriod;
	this.crashRecoveryTimeoutId = null;
}

RestartedProcess.prototype.stillCrashing = function() {
	clearTimeout(this.crashRecoveryTimeoutId);

	this.restarts++;

	// Reset the restart count when process considered not crashing
	this.crashRecoveryTimeoutId = setTimeout(function() {
		console.info("Process recovered");
		this.restarts = 0;
	}.bind(this), this.crashRecoveryPeriod);
};

module.exports = RestartedProcess;