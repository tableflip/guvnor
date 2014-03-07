var stubs = {
	child_process: {}
};

var should = require("should"),
	sinon = require("sinon"),
	path = require("path"),
	proxyquire = require("proxyquire"),
	DaemonStarter = proxyquire(path.resolve(__dirname, "../lib/DaemonStarter"), stubs);

var daemonStarter = new DaemonStarter();

describe("DaemonStarter", function(){
	describe("_startDaemon", function(){
		it("should start the process starter daemon", function(done) {
			var starter = {
				once: sinon.stub(),
				unref: sinon.stub()
			}

			stubs.child_process.fork = function(module) {
				should(module).not.be.null;

				return starter;
			};

			daemonStarter.on("daemonrunning", done);

			// the method under test
			daemonStarter._startDaemon();

			starter.unref.callCount.should.equal(1);

			// invoke the callback
			starter.once.callCount.should.equal(1);
			starter.once.getCall(0).args[0].should.equal("message");
			starter.once.getCall(0).args[1]();
		})
	})
})
