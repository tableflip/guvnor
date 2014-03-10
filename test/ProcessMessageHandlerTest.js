var stubs = {
	usage: {}
};

var should = require("should"),
	sinon = require("sinon"),
	path = require("path"),
	proxyquire = require("proxyquire"),
	ProcessMessageHandler = proxyquire(path.resolve(__dirname, "../lib/ProcessMessageHandler"), stubs);

var processMessageHandler = new ProcessMessageHandler();

describe("ProcessMessageHandler", function() {
	describe("boss:status", function() {
		it("should return process status", function(done) {
			process.send = sinon.stub();
			process.listeners = sinon.stub();
			process.listeners.withArgs("message").returns([{}, {}]);

			stubs.usage.lookup = sinon.stub();
			stubs.usage.lookup.callsArgWith(2, null, {cpu: 10});

			processMessageHandler["boss:status"]({type: "boss:status"});

			process.send.callCount.should.equal(1);

			var event = process.send.getCall(0).args[0];
			event.type.should.equal("process:status");
			event.status.usage.cpu.should.equal(10);

			done();
		});
	});
});
