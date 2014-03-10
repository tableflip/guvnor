var stubs = {
	path: {},
	"./LogRedirector": function() {
		this.on = function(event, func) {
			func();
		}
	}
};

var should = require("should"),
	sinon = require("sinon"),
	path = require("path"),
	proxyquire = require("proxyquire");

describe("ProcessWrapper", function() {
	it("should set the process title", function(done) {
		var processTitle = "blah";

		stubs.path.resolve = sinon.stub();
		stubs.path.resolve.returns("/dev/null");

		process.env.BOSS_PROCESS_NAME = processTitle;
		process.nextTick = function(){};
		process.send = function(){};

		var ProcessWrapper = proxyquire(path.resolve(__dirname, "../lib/ProcessWrapper"), stubs);
		new ProcessWrapper();

		process.title.should.equal(processTitle);

		done();
	});

	it("should remove boss properties from the environment", function(done) {
		stubs.path.resolve = sinon.stub();
		stubs.path.resolve.returns("/dev/null");

		process.env.BOSS_TEST_PROPERTY = "foo";
		process.nextTick = function(){};
		process.send = function(){};

		var ProcessWrapper = proxyquire(path.resolve(__dirname, "../lib/ProcessWrapper"), stubs);
		new ProcessWrapper();

		should(process.env.BOSS_TEST_PROPERTY).be.undefined;

		done();
	});
})
