var expect = require('chai').expect,
  sinon = require('sinon'),
  inherits = require('util').inherits,
  EventEmitter = require('events').EventEmitter,
  ProcessInfo = require('../../../../lib/daemon/domain/ProcessInfo'),
  ProcessService = require('../../../../lib/daemon/service/ProcessService')

describe('ProcessService', function () {
  var processService, clock

  beforeEach(function () {
    clock = sinon.useFakeTimers()

    processService = new ProcessService()
    processService._logger = {
      info: sinon.stub(),
      warn: sinon.stub(),
      error: sinon.stub(),
      debug: sinon.stub(),
      log: sinon.stub()
    }
    processService._portService = {
      freePort: sinon.stub()
    }
    processService._processInfoStore = {
      create: sinon.stub(),
      find: sinon.stub(),
      remove: sinon.stub(),
      all: sinon.stub().returns([])
    }
    processService._child_process = {
      fork: sinon.stub()
    }
    processService._config = {
      guvnor: {
        resettimeout: 5000
      }
    }
    processService._managedProcessFactory = {
      create: sinon.stub()
    }
    processService._appService = {
      findByName: sinon.stub()
    }
  })

  afterEach(function () {
    clock.restore()
  })

  it('should automatically restart a process on exit with non-zero code', function () {
    function MockProcess() {
      this.pid = Math.floor(Math.random() * 1000)
    }

    inherits(MockProcess, EventEmitter)

    MockProcess.prototype.kill = sinon.stub()

    var mockProcess0 = new MockProcess()
    var mockProcess1 = new MockProcess()

    processService._child_process.fork
      .onFirstCall().returns(mockProcess0)
      .onSecondCall().returns(mockProcess1)

    processService._portService.freePort.callsArgWith(0, undefined, 5)

    var processInfo = {
      id: 'foo',
      restartOnError: true,
      restartRetries: 5,
      restarts: 0,
      totalRestarts: 0,
      validate: sinon.stub().callsArg(0),
      getProcessArgs: sinon.stub(),
      getProcessOptions: sinon.stub(),
      logger: {
        error: sinon.stub()
      }
    }
    // processInfo.validate

    processService._processInfoStore.create.callsArgWith(1, undefined, processInfo)
    processService._processInfoStore.find.withArgs('id', processInfo.id).returns(processInfo)

    // Start a process
    processService.startProcess(__filename, {}, sinon.stub())

    expect(processService._child_process.fork.calledOnce).to.be.true

    mockProcess0.emit('message', {event: 'process:ready'})

    // Exit the mock process
    mockProcess0.emit('exit', 7)

    // A new challenger appears
    expect(processService._child_process.fork.calledTwice).to.be.true

    mockProcess1.emit('message', {event: 'process:ready'})

    expect(processService._processInfoStore.create.calledOnce).to.be.true
  })

  it('should find a process by pid', function () {
    processService._processInfoStore.find.withArgs('process.pid', 1).returns({
      prop: 'baz',
      process: {
        pid: 1
      }
    })

    expect(processService.findByPid(1).prop).to.equal('baz')
  })

  it('should notify of failure if reserving a debug port fails', function (done) {
    var processInfo = {
      validate: sinon.stub()
    }
    processInfo.validate.callsArgAsync(0)

    processService._processInfoStore.create.callsArgWithAsync(1, undefined, processInfo)

    processService.on('process:failed', function (processInfo) {
      expect(processInfo.status).to.equal('failed')

      done()
    })

    processService._portService.freePort.callsArgWith(0, new Error('AAIIIIEEEE!'))

    processService.startProcess('foo', {}, function () {
    })
  })

  it('should start a cluster manager', function (done) {
    var processInfo = {
      cluster: true,
      validate: sinon.stub(),
      getProcessArgs: sinon.stub(),
      getProcessOptions: sinon.stub()
    }
    processInfo.validate.callsArgAsync(0)

    var childProcess = {
      on: sinon.stub()
    }

    processService._processInfoStore.create.callsArgWith(1, undefined, processInfo)
    processService._child_process.fork.returns(childProcess)

    var emittedStartedClusterEvent = false

    processService.on('cluster:starting', function () {
      emittedStartedClusterEvent = true
    })

    processService.on('cluster:forked', function (processInfo) {
      expect(emittedStartedClusterEvent).to.be.true
      expect(processInfo.cluster).to.be.true

      done()
    })

    processService._portService.freePort.callsArgWith(0, undefined, 5)

    processService.startProcess('foo', {
      instances: 2
    }, function () {
    })
  })

  it('should forward events', function (done) {
    processService.on('foo:bar', function (processInfo, one, two, three) {
      expect(one).to.equal('one')
      expect(two).to.equal('two')
      expect(three).to.equal('three')

      done()
    })

    var processInfo = {
      process: new EventEmitter()
    }

    processService._forwardEvents(processInfo)

    // should cause the 'foo:bar' event to be emitted by the processService
    processInfo.process.emit('foo:bar', 'one', 'two', 'three')
  })

  it('should not restart a failing process when restartOnError is false', function () {
    var processInfo = {
      id: 'foo',
      restartOnError: false,
      process: {
        pid: 5
      }
    }

    processService._restartProcess(processInfo, 'process')

    // and not restarted it
    expect(processService._child_process.fork.notCalled).to.be.true
  })

  it('should not restart a failing process when retries exceeded', function (done) {
    var processInfo = {
      id: 'foo',
      restartOnError: true,
      process: {
        pid: 5
      },
      stillCrashing: sinon.stub(),
      restarts: 5,
      restartRetries: 5
    }
    processService._processes = {
      foo: processInfo
    }

    processService.on('process:aborted', function (info) {
      expect(info).to.equal(processInfo)

      // should have set status
      expect(processInfo.status).to.equal('aborted')

      done()
    })

    processService._restartProcess(processInfo, 'process')

    // should not have restarted it
    expect(processService._child_process.fork.called).to.be.false
  })

  it('should restart a failing process when restarts are fewer than retries', function () {
    var processInfo = {
      id: 'foo',
      process: {
        pid: 1
      },
      restartOnError: true,
      stillCrashing: sinon.stub(),
      restarts: 2,
      restartRetries: 5,
      totalRestarts: 0
    }

    processService._startProcess = sinon.stub()

    processService._restartProcess(processInfo, 'process')

    // should have restarted it
    expect(processService._startProcess.calledOnce).to.be.true
  })

  it('should forward events from child process', function (done) {
    var childProcess = new EventEmitter()
    childProcess.pid = 5
    var processInfo = {
      id: 'foo',
      process: childProcess,
      validate: sinon.stub().callsArg(0),
      getProcessArgs: sinon.stub(),
      getProcessOptions: sinon.stub(),
      logger: processService._logger
    }
    processService._processes = {
      foo: processInfo
    }
    processService._portService.freePort.callsArgWith(0, undefined, 5)
    processService._child_process.fork.returns(childProcess)
    processService._processInfoStore.create.callsArgWith(1, undefined, processInfo)

    processService.startProcess(__filename, {}, sinon.stub())

    var events = [
      'process:log:info', 'process:log:error', 'process:log:warn', 'process:log:debug'
    ]
    var invocations = 0

    events.forEach(function (event) {
      processService.on(event, function () {
        invocations++

        if (invocations == events.length) {
          done()
        }
      })
    })

    events.forEach(function (event) {
      childProcess.emit(event, {
        message: 'hello'
      })
    })
  })

  it('should send config to child process when requested', function () {
    var childProcess = new EventEmitter()
    childProcess.pid = 5
    childProcess.send = sinon.stub()
    var processInfo = {
      id: 'foo',
      process: childProcess,
      validate: sinon.stub().callsArg(0),
      getProcessArgs: sinon.stub(),
      getProcessOptions: sinon.stub(),
      logger: processService._logger
    }
    processService._processes = {
      foo: processInfo
    }
    processService._portService.freePort.callsArgWith(0, undefined, 5)
    processService._child_process.fork.returns(childProcess)
    processService._processInfoStore.create.callsArgWith(1, undefined, processInfo)

    processService.startProcess(__filename, {}, sinon.stub())

    childProcess.emit('process:config:request')

    expect(childProcess.send.callCount).to.equal(1)
    expect(childProcess.send.getCall(0).args[0].event).to.equal('daemon:config:response')
    expect(childProcess.send.getCall(0).args[0].args[0]).to.equal(processService._config)
  })

  it('should connect to process rpc socket after startup', function (done) {
    var remote = {
      connect: sinon.stub()
    }
    var childProcess = new EventEmitter()
    childProcess.pid = 5
    childProcess.send = sinon.stub()
    var processInfo = {
      id: 'foo',
      process: childProcess,
      validate: sinon.stub().callsArg(0),
      getProcessArgs: sinon.stub(),
      getProcessOptions: sinon.stub(),
      logger: processService._logger,
      restarts: 1
    }
    processService._processes = {
      foo: processInfo
    }
    processService._portService.freePort.callsArgWith(0, undefined, 5)
    processService._child_process.fork.returns(childProcess)
    processService._processInfoStore.create.callsArgWith(1, undefined, processInfo)

    processService.on('process:ready', function (info) {
      expect(info).to.equal(processInfo)

      expect(processInfo.restarts).to.equal(1)

      clock.tick(processService._config.guvnor.resettimeout + 1)

      expect(processInfo.restarts).to.equal(0)

      done()
    })

    processService.startProcess(__filename, {}, sinon.stub())

    processService._managedProcessFactory.create.withArgs(['socket']).callsArgWith(1, undefined, remote)
    remote.connect.callsArgWith(0, undefined, remote)

    childProcess.emit('process:started', 'socket')

    expect(processInfo.status).to.equal('running')
    expect(processInfo.socket).to.equal('socket')
    expect(processInfo.remote).to.equal(remote)
  })

  it('should connect to cluster rpc socket after startup', function (done) {
    var remote = {
      connect: sinon.stub()
    }
    var processInfo = {
      id: 'foo',
      process: new EventEmitter()
    }

    processService.on('cluster:ready', function (info) {
      expect(info).to.equal(processInfo)
      expect(processInfo.status).to.equal('running')
      expect(processInfo.socket).to.equal('socket')
      expect(processInfo.remote).to.equal(remote)

      done()
    })

    processService.startProcess(__filename, {}, sinon.stub())

    processService._managedProcessFactory.create.withArgs(['socket']).callsArgWithAsync(1, undefined, remote)
    remote.connect.callsArgWithAsync(0, undefined, remote)

    processService._setupProcessCallbacks(processInfo, 'cluster')
    processInfo.process.emit('cluster:started', 'socket')
  })

  it('should mark processInfo as failed if connect to process rpc socket after startup fails', function (done) {
    var remote = {
      connect: sinon.stub()
    }
    var childProcess = new EventEmitter()
    childProcess.pid = 5
    var processInfo = {
      id: 'foo',
      process: childProcess,
      validate: sinon.stub().callsArg(0),
      getProcessArgs: sinon.stub(),
      getProcessOptions: sinon.stub(),
      logger: processService._logger
    }
    processService._processes = {
      foo: processInfo
    }
    processService._portService.freePort.callsArgWith(0, undefined, 5)
    processService._child_process.fork.returns(childProcess)
    processService._processInfoStore.create.callsArgWith(1, undefined, processInfo)

    processService.on('process:failed', function (info) {
      expect(info).to.equal(processInfo)
      expect(info.status).to.equal('failed')

      done()
    })

    processService.startProcess(__filename, {}, sinon.stub())

    processService._managedProcessFactory.create.withArgs(['socket']).callsArgWith(1, undefined, remote)
    remote.connect.callsArgWith(0, new Error('nope!'))

    childProcess.emit('process:started', 'socket')

    expect(processInfo.status).to.equal('failed')
    expect(processInfo.socket).to.equal('socket')
    expect(processInfo.remote).to.not.exist
  })

  it('should mark processInfo as errored if connect to process rpc socket after startup fails', function (done) {
    var childProcess = new EventEmitter()
    childProcess.pid = 5
    var processInfo = {
      id: 'foo',
      process: childProcess,
      validate: sinon.stub().callsArg(0),
      getProcessArgs: sinon.stub(),
      getProcessOptions: sinon.stub(),
      logger: processService._logger
    }
    processService._processes = {
      foo: processInfo
    }
    processService._portService.freePort.callsArgWith(0, undefined, 5)
    processService._child_process.fork.returns(childProcess)
    processService._processInfoStore.create.callsArgWith(1, undefined, processInfo)

    processService.on('process:errored', function (info) {
      expect(info).to.equal(processInfo)
      expect(info.status).to.equal('errored')

      done()
    })

    processService.startProcess(__filename, {}, sinon.stub())

    childProcess.emit('process:errored', 'socket')
  })

  it('should mark cluster processInfo as failed if connect to process rpc socket after startup fails', function (done) {
    var remote = {
      connect: sinon.stub()
    }
    var processInfo = {
      id: 'foo',
      process: new EventEmitter()
    }

    processService.on('cluster:failed', function (info) {
      expect(info).to.equal(processInfo)
      expect(info.status).to.equal('failed')

      done()
    })

    remote.connect.callsArgWithAsync(0, new Error('nope!'))
    processService._managedProcessFactory.create.withArgs(['socket']).callsArgWithAsync(1, undefined, remote)

    processService._setupProcessCallbacks(processInfo, 'cluster')
    processInfo.process.emit('cluster:started', 'socket')
  })

  it('should forward stopping event and set status to stopping', function (done) {
    var processInfo = {
      id: 'foo',
      process: new EventEmitter()
    }

    processService.on('cluster:stopping', function (info) {
      expect(info).to.equal(processInfo)
      expect(info.status).to.equal('stopping')

      done()
    })

    processService._setupProcessCallbacks(processInfo, 'cluster')
    processInfo.process.emit('cluster:stopping', 'socket')
  })

  it('should forward failed event and set status to failed', function (done) {
    var processInfo = {
      id: 'foo',
      process: new EventEmitter()
    }

    processService.on('cluster:failed', function (info) {
      expect(info).to.equal(processInfo)
      expect(info.status).to.equal('failed')

      done()
    })

    processService._setupProcessCallbacks(processInfo, 'cluster')
    processInfo.process.emit('cluster:failed', new Error('urk!'))
  })

  it('should forward restarting event and set status to restarting', function (done) {
    var childProcess = new EventEmitter()
    childProcess.pid = 5
    var processInfo = {
      id: 'foo',
      process: childProcess,
      validate: sinon.stub().callsArg(0),
      getProcessArgs: sinon.stub(),
      getProcessOptions: sinon.stub(),
      logger: processService._logger
    }
    processService._processes = {
      foo: processInfo
    }
    processService._portService.freePort.callsArgWith(0, undefined, 5)
    processService._child_process.fork.returns(childProcess)
    processService._processInfoStore.create.callsArgWith(1, undefined, processInfo)
    processService.startProcess(__filename, {}, sinon.stub())

    processService.on('process:restarting', function (info) {
      expect(info).to.equal(processInfo)
      expect(info.status).to.equal('restarting')
      expect(info.restarts).to.equal(0)

      done()
    })

    childProcess.emit('process:restarting')
  })

  it('should forward uncaughtexception event', function (done) {
    var childProcess = new EventEmitter()
    childProcess.pid = 5
    var processInfo = {
      id: 'foo',
      process: childProcess,
      validate: sinon.stub().callsArg(0),
      getProcessArgs: sinon.stub(),
      getProcessOptions: sinon.stub(),
      logger: processService._logger
    }
    processService._processes = {
      foo: processInfo
    }
    processService._portService.freePort.callsArgWith(0, undefined, 5)
    processService._child_process.fork.returns(childProcess)
    processService._processInfoStore.create.callsArgWith(1, undefined, processInfo)
    processService.startProcess(__filename, {}, sinon.stub())

    processService.on('process:uncaughtexception', function (info) {
      expect(info).to.equal(processInfo)

      done()
    })

    childProcess.emit('process:uncaughtexception', new Error('urk!'))
  })

  it('should forward process events from child process', function (done) {
    var childProcess = new EventEmitter()
    childProcess.pid = 5
    var processInfo = {
      id: 'foo',
      process: childProcess,
      validate: sinon.stub().callsArg(0),
      getProcessArgs: sinon.stub(),
      getProcessOptions: sinon.stub(),
      logger: processService._logger
    }
    processService._processes = {
      foo: processInfo
    }
    processService._portService.freePort.callsArgWith(0, undefined, 5)
    processService._child_process.fork.returns(childProcess)
    processService._processInfoStore.create.callsArgWith(1, undefined, processInfo)

    processService.startProcess(__filename, {}, sinon.stub())

    var events = [
      'process:forked', 'process:starting', 'process:ready',
      'process:heapdump:start', 'process:heapdump:error', 'process:heapdump:complete',
      'process:gc:start', 'process:gc:error', 'process:gc:complete'
    ]
    var invocations = 0

    events.forEach(function (event) {
      processService.on(event, function () {
        invocations++

        if (invocations == events.length) {
          done()
        }
      })
    })

    events.forEach(function (event) {
      childProcess.emit(event)
    })
  })

  it('should forward cluster failed event and set status to failed', function (done) {
    var processInfo = {
      id: 'foo',
      process: new EventEmitter()
    }

    processService.on('cluster:failed', function (info) {
      expect(info).to.equal(processInfo)
      expect(info.status).to.equal('failed')

      done()
    })

    processService._setupProcessCallbacks(processInfo, 'cluster')
    processInfo.process.emit('cluster:failed', new Error('urk!'))
  })

  it('should forward cluster online event', function (done) {
    var childProcess = new EventEmitter()
    childProcess.pid = 5
    var processInfo = {
      id: 'foo',
      process: childProcess,
      validate: sinon.stub().callsArg(0),
      getProcessArgs: sinon.stub(),
      getProcessOptions: sinon.stub(),
      logger: processService._logger,
      cluster: true
    }
    processService._processes = {
      foo: processInfo
    }
    processService._portService.freePort.callsArgWith(0, undefined, 5)
    processService._child_process.fork.returns(childProcess)
    processService._processInfoStore.create.callsArgWith(1, undefined, processInfo)
    processService.startProcess(__filename, {}, sinon.stub())

    processService.on('cluster:online', function (info) {
      expect(info).to.equal(processInfo)

      done()
    })

    childProcess.emit('cluster:online')
  })
  /*
   it('should forward cluster ready event', function(done) {
   var socket = 'socket'
   var remote = {
   connect: sinon.stub()
   }
   var processInfo = {
   id: 'foo',
   process: new EventEmitter()
   }
   processService._processes = {
   foo: processInfo
   }
   processService._portService.freePort.callsArgWithAsync(0, undefined, 5)
   processService._child_process.fork.returns(childProcess)
   processService._processInfoStore.create.callsArgWithAsync(1, undefined, processInfo)
   processService._managedProcessFactory.create.withArgs(['socket']).callsArgWithAsync(1, undefined, remote)
   remote.connect.callsArgWithAsync(0, undefined, remote)
   processService.startProcess(__filename, {}, sinon.stub())

   var receivedStartedEvent = false

   processService.on('process:started', function(info) {
   expect(info).to.equal(processInfo)
   expect(info.status).to.equal('started')

   receivedStartedEvent = true
   })

   processService.on('cluster:ready', function(info) {
   expect(info).to.equal(processInfo)
   expect(info.remote).to.equal(remote)
   expect(info.status).to.equal('running')

   expect(receivedStartedEvent).to.be.true

   done()
   })

   childProcess.emit('cluster:started', socket)
   })
   */
  it('should emit cluster failed event if connecting to cluster rpc fails', function (done) {
    var socket = 'socket'
    var remote = {
      connect: sinon.stub()
    }
    var processInfo = {
      id: 'foo',
      process: new EventEmitter()
    }
    processService._managedProcessFactory.create.withArgs([socket]).callsArgWithAsync(1, undefined, remote)
    remote.connect.callsArgWithAsync(0, new Error('nope!'))

    var receivedStartedEvent = false

    processService.on('cluster:started', function (info) {
      expect(info).to.equal(processInfo)
      expect(info.status).to.equal('started')

      receivedStartedEvent = true
    })

    processService.on('cluster:failed', function (info) {
      expect(info).to.equal(processInfo)
      expect(info.status).to.equal('failed')

      expect(receivedStartedEvent).to.be.true

      done()
    })

    processService._setupProcessCallbacks(processInfo, 'cluster')
    processInfo.process.emit('cluster:started', socket)
  })

  it('should forward cluster worker events from child process', function (done) {
    var childProcess = new EventEmitter()
    childProcess.pid = 5
    var processInfo = {
      id: 'foo',
      process: childProcess,
      validate: sinon.stub().callsArg(0),
      getProcessArgs: sinon.stub(),
      getProcessOptions: sinon.stub(),
      logger: processService._logger,
      cluster: true
    }
    processService._processes = {
      foo: processInfo
    }
    processService._portService.freePort.callsArgWith(0, undefined, 5)
    processService._child_process.fork.returns(childProcess)
    processService._processInfoStore.create.callsArgWith(1, undefined, processInfo)

    processService.startProcess(__filename, {}, sinon.stub())

    var events = [
      'worker:forked', 'worker:starting', 'worker:started', 'worker:ready',
      'worker:stopping', 'worker:exit', 'worker:failed', 'worker:restarting',
      'worker:aborted', 'worker:uncaughtexception',
      'worker:heapdump:start', 'worker:heapdump:error',
      'worker:heapdump:complete', 'worker:gc:start',
      'worker:gc:error', 'worker:gc:complete'
    ]
    var invocations = 0

    events.forEach(function (event) {
      processService.on(event, function () {
        invocations++

        if (invocations == events.length) {
          done()
        }
      })
    })

    events.forEach(function (event) {
      childProcess.emit(event)
    })
  })

  it('should update number of cluster workers event', function () {
    var childProcess = new EventEmitter()
    childProcess.pid = 5
    var processInfo = {
      id: 'foo',
      process: childProcess,
      validate: sinon.stub().callsArg(0),
      getProcessArgs: sinon.stub(),
      getProcessOptions: sinon.stub(),
      logger: processService._logger,
      cluster: true,
      instances: 2
    }
    processService._processes = {
      foo: processInfo
    }
    processService._portService.freePort.callsArgWith(0, undefined, 5)
    processService._child_process.fork.returns(childProcess)
    processService._processInfoStore.create.callsArgWith(1, undefined, processInfo)
    processService.startProcess(__filename, {}, sinon.stub())

    expect(processInfo.instances).to.equal(2)

    childProcess.emit('cluster:workers', 5)

    expect(processInfo.instances).to.equal(5)
  })

  it('should forward event when process exits cleanly', function (done) {
    var childProcess = new EventEmitter()
    childProcess.pid = 5
    var processInfo = {
      id: 'foo',
      process: childProcess,
      validate: sinon.stub().callsArg(0),
      getProcessArgs: sinon.stub(),
      getProcessOptions: sinon.stub(),
      logger: processService._logger
    }
    processService._processes = {
      foo: processInfo
    }
    processService._portService.freePort.callsArgWith(0, undefined, 5)
    processService._child_process.fork.returns(childProcess)
    processService._processInfoStore.create.callsArgWith(1, undefined, processInfo)
    processService.startProcess(__filename, {}, sinon.stub())
    processService._processInfoStore.find.withArgs('id', processInfo.id).returns(processInfo)

    processService.on('process:exit', function (info) {
      expect(info).to.equal(processInfo)

      done()
    })

    childProcess.emit('exit', 0)

    expect(processInfo.status).to.equal('stopped')
  })

  it('should only emit process exit once if error and exit are both fired', function () {
    var childProcess = new EventEmitter()
    childProcess.pid = 5
    var processInfo = {
      id: 'foo',
      process: childProcess,
      validate: sinon.stub().callsArg(0),
      getProcessArgs: sinon.stub(),
      getProcessOptions: sinon.stub(),
      logger: processService._logger,
      socket: 'foo',
      remote: {}
    }
    processService._processes = {
      foo: processInfo
    }
    processService._portService.freePort.callsArgWith(0, undefined, 5)
    processService._child_process.fork.returns(childProcess)
    processService._processInfoStore.create.callsArgWith(1, undefined, processInfo)
    processService.startProcess(__filename, {}, sinon.stub())
    processService._processInfoStore.find.withArgs('id', processInfo.id).onFirstCall().returns(processInfo)

    var invoked = 0

    processService.on('process:exit', function (info) {
      expect(info).to.equal(processInfo)

      invoked++
    })

    expect(processInfo.socket).to.be.ok
    expect(processInfo.remote).to.be.ok

    childProcess.emit('error', new Error('panic!'))
    childProcess.emit('exit', 5)

    expect(invoked).to.equal(1)
    expect(processInfo.socket).to.not.exist
    expect(processInfo.remote).to.not.exist
    expect(processInfo.status).to.equal('errored')
  })

  it('should remove a process', function (done) {
    var id = 'foo'
    var processInfo = {
      running: false
    }

    processService._processInfoStore.find.withArgs('id', id).returns(processInfo)

    processService.removeProcess(id, function (error) {
      expect(error).to.not.exist
      expect(processService._processInfoStore.remove.withArgs('id', id).called).to.be.true
      done()
    })
  })

  it('should object when removing a running process', function (done) {
    var id = 'foo'
    var processInfo = {
      running: true
    }

    processService._processInfoStore.find.withArgs('id', id).returns(processInfo)

    processService.removeProcess(id, function (error) {
      expect(error).to.be.ok
      done()
    })
  })

  it('should not remove a process when that process does not exist', function (done) {
    var id = 'foo'

    processService.removeProcess(id, function (error) {
      expect(error).to.not.exist
      expect(processService._processInfoStore.remove.called).to.be.false
      done()
    })
  })

  it('should list all processes', function () {
    var processes = []

    processService._processInfoStore.all.returns(processes)

    var list = processService.listProcesses()

    expect(list).to.equal(processes)
  })

  it('should kill all processes', function () {
    var processes = [{
      remote: {
        kill: sinon.stub()
      },
      process: {
        kill: sinon.stub()
      }
    }, {
      process: {
        kill: sinon.stub()
      }
    }]

    processService._processInfoStore.all.returns(processes)

    processService.killAll()

    expect(processes[0].remote.kill.called).to.be.true
    expect(processes[0].process.kill.called).to.be.false
    expect(processes[1].process.kill.called).to.be.true
  })

  it('should find a process by name', function () {
    var name = 'foo'
    var processInfo = {}

    processService._processInfoStore.find.withArgs('name', name).returns(processInfo)

    var returned = processService.findByName(name)

    expect(returned).to.equal(processInfo)
  })

  it('should not reset the reset count of a process that fails shortly after startup', function (done) {
    var remote = {
      connect: sinon.stub()
    }
    var childProcess = new EventEmitter()
    childProcess.pid = 5
    childProcess.send = sinon.stub()
    var processInfo = {
      id: 'foo',
      process: childProcess,
      validate: sinon.stub().callsArg(0),
      getProcessArgs: sinon.stub(),
      getProcessOptions: sinon.stub(),
      logger: processService._logger
    }
    processService._processes = {
      foo: processInfo
    }
    processService._portService.freePort.callsArgWith(0, undefined, 5)
    processService._child_process.fork.returns(childProcess)
    processService._processInfoStore.create.callsArgWith(1, undefined, processInfo)

    processService.on('process:ready', function (info) {
      expect(info).to.equal(processInfo)

      processInfo.status = 'aborted'

      var previousRestartCount = processInfo.restarts = 3

      clock.tick(processService._config.guvnor.resettimeout + 1)

      expect(processInfo.restarts).to.equal(previousRestartCount)

      done()
    })

    processService.startProcess(__filename, {}, sinon.stub())

    processService._managedProcessFactory.create.withArgs(['socket']).callsArgWith(1, undefined, remote)
    remote.connect.callsArgWith(0, undefined, remote)

    childProcess.emit('process:started', 'socket')
  })

  it('should emit a failed message if creating the managed process object fails', function (done) {
    var error = new Error('urk!')
    error.code = 'FAIL'

    var processInfo = {}

    processService.on('process:failed', function (info, er) {
      expect(info).to.equal(processInfo)
      expect(processInfo.status).to.equal('failed')
      expect(er.code).to.equal(error.code)
      expect(er.stack).to.equal(error.stack)

      done()
    })

    processService._managedProcessFactory.create.withArgs(['socket']).callsArgWith(1, error)

    processService._handleProcessStarted(processInfo, 'process', 'socket')
  })

  it('should write to stdin for a process', function () {
    var processInfo = {
      process: new EventEmitter()
    }
    processInfo.process.stdin = {
      write: sinon.stub()
    }

    var prefix = 'process'
    var string = 'foo'

    processService._setupProcessCallbacks(processInfo, prefix)

    processInfo.process.emit(prefix + ':stdin:write', string)

    expect(processInfo.process.stdin.write.calledWith(string + '\n')).to.be.true
  })

  it('should send a signal to a process', function () {
    var processInfo = {
      process: new EventEmitter()
    }
    processInfo.process.kill = sinon.stub()

    var prefix = 'process'
    var signal = 'foo'

    processService._setupProcessCallbacks(processInfo, prefix)

    processInfo.process.emit(prefix + ':signal', signal)

    expect(processInfo.process.kill.calledWith(signal)).to.be.true
  })

  it('should survive sending an invalid signal to a process', function () {
    var processInfo = {
      process: new EventEmitter()
    }
    processInfo.process.kill = sinon.stub().throws(new Error('invalid!'))

    var prefix = 'process'
    var signal = 'foo'

    processService._setupProcessCallbacks(processInfo, prefix)

    processInfo.process.emit(prefix + ':signal', signal)

    expect(processInfo.process.kill.calledWith(signal)).to.be.true
  })

  it('should start an existing process', function (done) {
    var processInfo = new ProcessInfo({
      script: 'foo'
    })
    var callback = sinon.stub()

    processService._startProcess = function (proc, cb) {
      expect(proc).to.equal(processInfo)
      expect(cb).to.equal(callback)

      done()
    }

    processService.startProcess(processInfo, callback)
  })

  it('should not start a running process', function (done) {
    var processInfo = new ProcessInfo({
      script: 'foo'
    })
    processInfo.status = 'running'

    processService._processInfoStore.find.withArgs('name', 'foo').returns(processInfo)

    processService.startProcess('foo', {}, function (error) {
      expect(error.message).to.contain('already running')

      done()
    })
  })

  it('should start a stopped process', function (done) {
    var processInfo = new ProcessInfo({
      script: 'foo'
    })
    processInfo.status = 'stopped'
    var callback = sinon.stub()

    processService._processInfoStore.find.withArgs('name', 'foo').returns(processInfo)

    processService._startProcess = function (proc, cb) {
      expect(proc).to.equal(processInfo)
      expect(cb).to.equal(callback)

      done()
    }

    processService.startProcess('foo', {}, callback)
  })
})
