var ProcessMessageHandler = require("./ProcessMessageHandler");

var ProcessCallbacks = function() {
	this._messageHandler = new ProcessMessageHandler();
};

ProcessCallbacks.prototype.uncaughtException = function(error) {
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

ProcessCallbacks.prototype.message = function(event) {
	if(!event || !event.type) {
		return;
	}

	if(this._messageHandler[event.type]) {
		this._messageHandler[event.type].apply(this._messageHandler, arguments);
	}
}

module.exports = ProcessCallbacks;
