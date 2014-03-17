var should = require("should"),
	sinon = require("sinon"),
	BossRPC = require("../lib/BossRPC");

describe("BossRPC", function() {
	describe("listProcesses", function() {
		it("should return a list of running processes", function(done) {
			function mockProcess() {
				var proc = {
					on: function() {},
					send: function() {},
					removeListener: function() {},
					kill: function() {}
				};

				sinon.stub(proc, "on", function(eventName, handler) {
					if(eventName == "message") {
						proc._onMessage = handler;
					}
				});

				// When boss:status message is sent, reply eventually
				sinon.stub(proc, "send", function(msg) {
					if(msg.type == "boss:status") {
						setTimeout(function() {
							proc._onMessage({
								type: "process:status",
								status: {
									pid: Math.floor(Math.random() * 138)
								}
							});
						}, Math.floor(Math.random() * 4));
					}
				})

				sinon.stub(proc, "removeListener", function(eventName, handler) {
					if(eventName == "message" && handler == proc._onMessage) {
						proc._onMessage = null
					}
				});

				return proc;
			}

			var processes = [];
			var numProcesses = Math.floor(Math.random() * 20);

			// Create new process mocks
			for(var i = 0; i < numProcesses; i++) {
				processes.push(mockProcess());
			}

			// Create new BossRPC
			var boss = new BossRPC();

			// Load her up
			boss._processes = processes;

			// Method under test
			boss.listProcesses(function(error, procs) {
				should.not.exists(error);
				procs.length.should.be.equal(processes.length);
				done();
			});
		});
	});
});