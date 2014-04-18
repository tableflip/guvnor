var should = require("should"),
	sinon = require("sinon"),
	inherits = require("util").inherits,
	EventEmitter = require("events").EventEmitter,
	proxyquire = require("proxyquire"),
	ProcessInfo = require("../lib/ProcessInfo");

describe("BossRPC", function() {
	describe("listProcesses", function() {
		it("should return a list of running processes", function (done) {
			var BossRPC = proxyquire("../lib/BossRPC", {});

			function mockProcess() {
				var proc = {
					on: function () {
					},
					send: function () {
					},
					removeListener: function () {
					},
					kill: function () {
					}
				};

				sinon.stub(proc, "on", function (eventName, handler) {
					if (eventName == "message") {
						proc._onMessage = handler;
					}
				});

				// When boss:status message is sent, reply eventually
				sinon.stub(proc, "send", function (msg) {
					if (msg.type == "boss:status") {
						setTimeout(function () {
							proc._onMessage({
								type: "process:status",
								status: {
									pid: Math.floor(Math.random() * 138)
								}
							});
						}, Math.floor(Math.random() * 4));
					}
				});

				sinon.stub(proc, "removeListener", function (eventName, handler) {
					if (eventName == "message" && handler == proc._onMessage) {
						proc._onMessage = null
					}
				});

				return proc;
			}

			var processes = [];
			var numProcesses = Math.floor(Math.random() * 20);

			// Create new process mocks
			for (var i = 0; i < numProcesses; i++) {
				processes.push(new ProcessInfo("mock-process-" + i + ".js", mockProcess()));
			}

			// Create new BossRPC
			var boss = new BossRPC();

			// Load her up
			boss._processes = processes;

			// Method under test
			boss.listProcesses(function (error, procs) {
				should.not.exists(error);
				procs.length.should.be.equal(processes.length);
				done();
			});
		});

		it("should return a list of running processes, even if a process doesn't reply", function (done) {
			this.timeout(10000);

			var BossRPC = proxyquire("../lib/BossRPC", {});

			function mockProcess() {
				var proc = {
					on: function () {
					},
					send: function () {
					},
					removeListener: function () {
					},
					kill: function () {
					}
				};

				sinon.stub(proc, "on", function (eventName, handler) {
					if (eventName == "message") {
						proc._onMessage = handler;
					}
				});

				proc.send = sinon.stub();

				sinon.stub(proc, "removeListener", function (eventName, handler) {
					if (eventName == "message" && handler == proc._onMessage) {
						proc._onMessage = null
					}
				});

				return proc;
			}

			var processes = [];
			var numProcesses = Math.floor(Math.random() * 20);

			// Create new process mocks
			for (var i = 0; i < numProcesses; i++) {
				processes.push(new ProcessInfo("mock-process-" + i + ".js", mockProcess()));
			}

			// Create new BossRPC
			var boss = new BossRPC();

			// Load her up
			boss._processes = processes;

			// Method under test
			boss.listProcesses(function (error, procs) {
				should.not.exists(error);
				procs.length.should.be.equal(processes.length);
				done();
			});
		});
	});

	describe("startProcess", function() {

		it("should automatically restart a process on exit with non-zero code", function(done) {
			function MockProcess() {
				this.pid = Math.floor(Math.random() * 1000)
			}

			inherits(MockProcess, EventEmitter);

			MockProcess.prototype.kill = sinon.stub();

			var mockProcess0 = new MockProcess();
			var mockProcess1 = new MockProcess();

			var forkStub = sinon.stub();

			forkStub.onFirstCall().returns(mockProcess0).onSecondCall().returns(mockProcess1);

			var BossRPC = proxyquire("../lib/BossRPC", {
				child_process: {
					fork: forkStub
				}
			});

			var boss = new BossRPC();
			boss._config = {logging: {directory: "/log"}};

			// Start a process
			boss.startProcess(__filename, {}, function () {});

			mockProcess0.emit("message", {type: "process:ready"});

			forkStub.calledOnce.should.be.true;

			// Exit the mock process
			mockProcess0.emit("exit", 7);

			// A new challenger appears
			forkStub.calledTwice.should.be.true;

			mockProcess1.emit("message", {type: "process:ready"});

			done();
		});
	});
});