/**
 * I do the hard work
 */
var Core = function(options) {
	this._processes = [];
}

Core.prototype.listProcesses = function(callback) {
	callback(null, JSON.parse(JSON.stringify(this._processes)));
}

Core.prototype.startProcess = function(path, options) {

}

module.exports = Core;