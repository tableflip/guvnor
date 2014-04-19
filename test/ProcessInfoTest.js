var should = require("should"),
	sinon = require("sinon"),
	ProcessInfo = require("../lib/ProcessInfo");

describe("ProcessInfo", function() {
	it("should recover the process after crash recovery period", function(done) {
		var processInfo = new ProcessInfo("test.js", sinon.stub(), {
			crashRecoveryPeriod: 500
		});

		processInfo.restarts.should.equal(0);
		processInfo.totalRestarts.should.equal(0);

		// Method under test
		processInfo.stillCrashing();

		processInfo.restarts.should.equal(1);
		processInfo.totalRestarts.should.equal(1);

		// After the crash recovery period, restarts should be reset
		setTimeout(function() {
			processInfo.restarts.should.equal(0);
			processInfo.totalRestarts.should.equal(1);
			done();
		}, 1000);
	});
});