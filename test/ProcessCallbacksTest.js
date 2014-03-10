var stubs = {

};

var should = require("should"),
	sinon = require("sinon"),
	path = require("path"),
	proxyquire = require("proxyquire"),
	ProcessCallbacks = proxyquire(path.resolve(__dirname, "../lib/ProcessCallbacks"), stubs);

var processCallbacks = new ProcessCallbacks();

describe("ProcessCallbacks", function() {
	describe("uncaughtException", function() {
		it("should notify of uncaught exceptions", function(done) {
			process.send = sinon.stub();

			process.listeners = sinon.stub();
			process.listeners.withArgs("uncaughtException").returns([{}, {}]);

			processCallbacks.uncaughtException({});

			process.send.callCount.should.equal(1);

			var event = process.send.getCall(0).args[0];
			event.type.should.equal("uncaughtException");

			done();
		});
	});

	describe("message", function() {
		it("should survive bad messages", function(done) {
			process.send = sinon.stub();
			process.listeners = sinon.stub();
			process.listeners.withArgs("message").returns([{}, {}]);

			processCallbacks.message();

			process.send.callCount.should.equal(0);

			processCallbacks.message({});

			process.send.callCount.should.equal(0);

			done();
		});

		it("should delegate to message handler", function(done) {
			processCallbacks._messageHandler = {
				"foo:bar": sinon.stub()
			};

			processCallbacks.message({type: "foo:bar"});

			processCallbacks._messageHandler["foo:bar"].callCount.should.equal(1);

			done();
		});
	});
});
