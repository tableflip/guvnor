var expect = require('chai').expect,
  sinon = require('sinon'),
  inherits = require('util').inherits,
  EventEmitter = require('events').EventEmitter,
  ProcessInfo = require('../../../../lib/daemon/domain/ProcessInfo'),
  ProcessService = require('../../../../lib/daemon/service/ProcessService')

describe('ProcessService', function() {
  var processService

  beforeEach(function() {
    processService = new ProcessService()
    processService._logger = {
      info: sinon.stub(),
      warn: sinon.stub(),
      error: sinon.stub(),
      debug: sinon.stub(),
      log: sinon.stub()
    }
    processService._freeport = sinon.stub()
    processService._processInfoStore = {
      create: sinon.stub(),
      find: sinon.stub(),
      remove: sinon.stub()
    }
    processService._child_process = {
      fork: sinon.stub()
    }
    processService._config = {}
    processService._processFactory = {
      create: sinon.stub()
    }
    processService._appService = {
      findByName: sinon.stub()
    }
  })

  it('should automatically restart a process on exit with non-zero code', function() {
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

    processService._freeport.callsArgWith(0, undefined, 5)

    var processInfo = {
      id: 'foo',
      restartOnError: true,
      restartRetries: 5,
      restarts: 0,
      totalRestarts: 0,
      validate: sinon.stub().callsArg(0),
      getProcessArgs: sinon.stub(),
      getProcessOptions: sinon.stub()
    }
    //processInfo.validate

    processService._processInfoStore.create.callsArgWith(1, undefined, processInfo)
    processService._processInfoStore.find.withArgs('id', processInfo.id).returns(processInfo)

    // Start a process
    processService.startProcess(__filename, {}, sinon.stub())

    expect(processService._child_process.fork.calledOnce).to.be.true

    mockProcess0.emit('message', {type: 'process:ready'})

    // Exit the mock process
    mockProcess0.emit('exit', 7)

    // A new challenger appears
    expect(processService._child_process.fork.calledTwice).to.be.true

    mockProcess1.emit('message', {type: 'process:ready'})

    expect(processService._processInfoStore.create.calledOnce).to.be.true
  })

  it('should find a process by pid', function() {
    processService._processInfoStore.find.withArgs('process.pid', 1).returns({
      prop: 'baz',
      process: {
        pid: 1
      }
    })

    expect(processService.findByPid(1).prop).to.equal('baz')
  })

  it('should notify of failure if reserving a debug port fails', function(done) {
    var processInfo = {
      validate: sinon.stub()
    }
    processInfo.validate.callsArgAsync(0)

    processService._processInfoStore.create.callsArgWithAsync(1, undefined, processInfo)

    processService.on('process:failed', function(processInfo) {
      expect(processInfo.status).to.equal('failed')

      done()
    })

    processService._freeport.callsArgWith(0, new Error('AAIIIIEEEE!'))

    processService.startProcess('foo', {}, function() {

    })
  })

  it('should start a cluster manager', function(done) {
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

    processService.on('cluster:starting', function() {
      emittedStartedClusterEvent = true
    })

    processService.on('cluster:forked', function(processInfo) {
      expect(emittedStartedClusterEvent).to.be.true
      expect(processInfo.cluster).to.be.true

      done()
    })

    processService._freeport.callsArgWith(0, undefined, 5)

    processService.startProcess('foo', {
      instances: 2
    }, function() {

    })
  })

  it('should forward events', function(done) {
    processService.on('foo', function(one, two, three) {
      expect(one).to.equal('one')
      expect(two).to.equal('two')
      expect(three).to.equal('three')

      done()
    })

    processService._forwardEvent('one', 'foo', ['two', 'three'])
  })

  it('should not restart a failing process when restartOnError is false', function() {
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

  it('should not restart a failing process when retries exceeded', function(done) {
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

    processService.on('process:aborted', function(info) {
      expect(info).to.equal(processInfo)

      // should have set status
      expect(processInfo.status).to.equal('aborted')

      done()
    })

    processService._restartProcess(processInfo, 'process')

    // should not have restarted it
    expect(processService._child_process.fork.called).to.be.false
  })

  it('should restart a failing process when restarts are fewer than retries', function() {
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

  it('should forward events from child process', function(done) {
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
    processService._freeport.callsArgWith(0, undefined, 5)
    processService._child_process.fork.returns(childProcess)
    processService._processInfoStore.create.callsArgWith(1, undefined, processInfo)

    processService.startProcess(__filename, {}, sinon.stub())

    var events = [
      'process:log:info', 'process:log:error', 'process:log:warn', 'process:log:debug'
    ]
    var invocations = 0

    events.forEach(function(event) {
      processService.on(event, function() {
        invocations++

        if(invocations == events.length) {
          done()
        }
      })
    })

    events.forEach(function(event) {
      childProcess.emit(event, {
        message: 'hello'
      })
    })
  })

  it('should send config to child process when requested', function() {
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
    processService._freeport.callsArgWith(0, undefined, 5)
    processService._child_process.fork.returns(childProcess)
    processService._processInfoStore.create.callsArgWith(1, undefined, processInfo)

    processService.startProcess(__filename, {}, sinon.stub())

    childProcess.emit('process:config:request')

    expect(childProcess.send.callCount).to.equal(1)
    expect(childProcess.send.getCall(0).args[0].type).to.equal('boss:config:response')
    expect(childProcess.send.getCall(0).args[0].args[0]).to.equal(processService._config)
  })

  it('should connect to process rpc socket after startup', function(done) {
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
    processService._freeport.callsArgWith(0, undefined, 5)
    processService._child_process.fork.returns(childProcess)
    processService._processInfoStore.create.callsArgWith(1, undefined, processInfo)

    processService.on('process:ready', function(info) {
      expect(info).to.equal(processInfo)

      done()
    })

    processService.startProcess(__filename, {}, sinon.stub())

    processService._processFactory.create.withArgs(['socket']).callsArgWith(1, undefined, remote)
    remote.connect.callsArgWith(0, undefined, remote)

    childProcess.emit('process:started', 'socket')

    expect(processInfo.status).to.equal('running')
    expect(processInfo.socket).to.equal('socket')
    expect(processInfo.remote).to.equal(remote)
  })

  it('should connect to cluster rpc socket after startup', function(done) {
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
      logger: processService._logger,
      cluster: true
    }
    processService._processes = {
      foo: processInfo
    }
    processService._freeport.callsArgWith(0, undefined, 5)
    processService._child_process.fork.returns(childProcess)
    processService._processInfoStore.create.callsArgWith(1, undefined, processInfo)

    processService.on('cluster:started', function(info) {
      expect(info).to.equal(processInfo)

      done()
    })

    processService.startProcess(__filename, {}, sinon.stub())

    processService._processFactory.create.withArgs(['socket']).callsArgWith(1, undefined, remote)
    remote.connect.callsArgWith(0, undefined, remote)

    childProcess.emit('process:started', 'socket')

    expect(processInfo.status).to.equal('running')
    expect(processInfo.socket).to.equal('socket')
    expect(processInfo.remote).to.equal(remote)
  })

  it('should mark processInfo as failed if connect to process rpc socket after startup fails', function(done) {
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
    processService._freeport.callsArgWith(0, undefined, 5)
    processService._child_process.fork.returns(childProcess)
    processService._processInfoStore.create.callsArgWith(1, undefined, processInfo)

    processService.on('process:failed', function(info) {
      expect(info).to.equal(processInfo)
      expect(info.status).to.equal('failed')

      done()
    })

    processService.startProcess(__filename, {}, sinon.stub())

    processService._processFactory.create.withArgs(['socket']).callsArgWith(1, undefined, remote)
    remote.connect.callsArgWith(0, new Error('nope!'))

    childProcess.emit('process:started', 'socket')

    expect(processInfo.status).to.equal('failed')
    expect(processInfo.socket).to.equal('socket')
    expect(processInfo.remote).to.not.exist
  })

  it('should mark processInfo as errored if connect to process rpc socket after startup fails', function(done) {
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
    processService._freeport.callsArgWith(0, undefined, 5)
    processService._child_process.fork.returns(childProcess)
    processService._processInfoStore.create.callsArgWith(1, undefined, processInfo)

    processService.on('process:errored', function(info) {
      expect(info).to.equal(processInfo)
      expect(info.status).to.equal('errored')

      done()
    })

    processService.startProcess(__filename, {}, sinon.stub())

    childProcess.emit('process:errored', 'socket')
  })

  it('should mark cluster processInfo as failed if connect to process rpc socket after startup fails', function(done) {
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
      logger: processService._logger,
      cluster: true
    }
    processService._processes = {
      foo: processInfo
    }
    processService._freeport.callsArgWith(0, undefined, 5)
    processService._child_process.fork.returns(childProcess)
    processService._processInfoStore.create.callsArgWith(1, undefined, processInfo)

    processService.on('cluster:failed', function(info) {
      expect(info).to.equal(processInfo)
      expect(info.status).to.equal('failed')

      done()
    })

    processService.startProcess(__filename, {}, sinon.stub())

    processService._processFactory.create.withArgs(['socket']).callsArgWith(1, undefined, remote)
    remote.connect.callsArgWith(0, new Error('nope!'))

    childProcess.emit('process:started', 'socket')

    expect(processInfo.status).to.equal('failed')
    expect(processInfo.socket).to.equal('socket')
    expect(processInfo.remote).to.not.exist
  })

  it('should forward stopping event and set status to stopping', function(done) {
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
    processService._freeport.callsArgWith(0, undefined, 5)
    processService._child_process.fork.returns(childProcess)
    processService._processInfoStore.create.callsArgWith(1, undefined, processInfo)
    processService.startProcess(__filename, {}, sinon.stub())

    processService.on('process:stopping', function(info) {
      expect(info).to.equal(processInfo)
      expect(info.status).to.equal('stopping')

      done()
    })

    childProcess.emit('process:stopping')
  })

  it('should forward failed event and set status to failed', function(done) {
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
    processService._freeport.callsArgWith(0, undefined, 5)
    processService._child_process.fork.returns(childProcess)
    processService._processInfoStore.create.callsArgWith(1, undefined, processInfo)
    processService.startProcess(__filename, {}, sinon.stub())

    processService.on('process:failed', function(info) {
      expect(info).to.equal(processInfo)
      expect(info.status).to.equal('failed')

      done()
    })

    childProcess.emit('process:failed', new Error('urk!'))
  })

  it('should forward restarting event and set status to restarting', function(done) {
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
    processService._freeport.callsArgWith(0, undefined, 5)
    processService._child_process.fork.returns(childProcess)
    processService._processInfoStore.create.callsArgWith(1, undefined, processInfo)
    processService.startProcess(__filename, {}, sinon.stub())

    processService.on('process:restarting', function(info) {
      expect(info).to.equal(processInfo)
      expect(info.status).to.equal('restarting')
      expect(info.restarts).to.equal(0)

      done()
    })

    childProcess.emit('process:restarting')
  })

  it('should forward uncaughtexception event', function(done) {
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
    processService._freeport.callsArgWith(0, undefined, 5)
    processService._child_process.fork.returns(childProcess)
    processService._processInfoStore.create.callsArgWith(1, undefined, processInfo)
    processService.startProcess(__filename, {}, sinon.stub())

    processService.on('process:uncaughtexception', function(info) {
      expect(info).to.equal(processInfo)

      done()
    })

    childProcess.emit('process:uncaughtexception', new Error('urk!'))
  })

  it('should forward process events from child process', function(done) {
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
    processService._freeport.callsArgWith(0, undefined, 5)
    processService._child_process.fork.returns(childProcess)
    processService._processInfoStore.create.callsArgWith(1, undefined, processInfo)

    processService.startProcess(__filename, {}, sinon.stub())

    var events = [
      'process:forked', 'process:starting', 'process:ready',
      'process:heapdump:start', 'process:heapdump:error', 'process:heapdump:complete',
      'process:gc:start', 'process:gc:error', 'process:gc:complete'
    ]
    var invocations = 0

    events.forEach(function(event) {
      processService.on(event, function() {
        invocations++

        if(invocations == events.length) {
          done()
        }
      })
    })

    events.forEach(function(event) {
      childProcess.emit(event)
    })
  })

  it('should forward cluster failed event', function(done) {
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
    processService._freeport.callsArgWith(0, undefined, 5)
    processService._child_process.fork.returns(childProcess)
    processService._processInfoStore.create.callsArgWith(1, undefined, processInfo)
    processService.startProcess(__filename, {}, sinon.stub())

    processService.on('cluster:failed', function(info) {
      expect(info).to.equal(processInfo)

      done()
    })

    childProcess.emit('cluster:failed', new Error('urk!'))
  })

  it('should forward cluster online event', function(done) {
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
    processService._freeport.callsArgWith(0, undefined, 5)
    processService._child_process.fork.returns(childProcess)
    processService._processInfoStore.create.callsArgWith(1, undefined, processInfo)
    processService.startProcess(__filename, {}, sinon.stub())

    processService.on('cluster:online', function(info) {
      expect(info).to.equal(processInfo)

      done()
    })

    childProcess.emit('cluster:online')
  })

  it('should forward cluster ready event', function(done) {
    var socket = 'socket'
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
      logger: processService._logger,
      cluster: true
    }
    processService._processes = {
      foo: processInfo
    }
    processService._freeport.callsArgWith(0, undefined, 5)
    processService._child_process.fork.returns(childProcess)
    processService._processInfoStore.create.callsArgWith(1, undefined, processInfo)
    processService._processFactory.create.withArgs(['socket']).callsArgWith(1, undefined, remote)
    remote.connect.callsArgWith(0, undefined, remote)
    processService.startProcess(__filename, {}, sinon.stub())

    var receivedStartedEvent = false

    processService.on('cluster:started', function(info) {
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

  it('should emit cluster failed event if connecting to cluster rpc fails', function(done) {
    var socket = 'socket'
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
      logger: processService._logger,
      cluster: true
    }
    processService._processes = {
      foo: processInfo
    }
    processService._freeport.callsArgWith(0, undefined, 5)
    processService._child_process.fork.returns(childProcess)
    processService._processInfoStore.create.callsArgWith(1, undefined, processInfo)
    processService._processFactory.create.withArgs(['socket']).callsArgWith(1, undefined, remote)
    remote.connect.callsArgWith(0, new Error('nope!'))
    processService.startProcess(__filename, {}, sinon.stub())

    var receivedStartedEvent = false

    processService.on('cluster:started', function(info) {
      expect(info).to.equal(processInfo)
      expect(info.status).to.equal('started')

      receivedStartedEvent = true
    })

    processService.on('cluster:failed', function(info) {
      expect(info).to.equal(processInfo)
      expect(info.status).to.equal('failed')

      expect(receivedStartedEvent).to.be.true

      done()
    })

    childProcess.emit('cluster:started', socket)
  })

  it('should forward cluster worker events from child process', function(done) {
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
    processService._freeport.callsArgWith(0, undefined, 5)
    processService._child_process.fork.returns(childProcess)
    processService._processInfoStore.create.callsArgWith(1, undefined, processInfo)

    processService.startProcess(__filename, {}, sinon.stub())

    var events = [
      'worker:forked', 'worker:starting', 'worker:started',  'worker:ready',
      'worker:stopping', 'worker:exit', 'worker:failed',  'worker:restarting',
      'worker:aborted', 'worker:uncaughtexception',
      'worker:heapdump:start', 'worker:heapdump:error',
      'worker:heapdump:complete', 'worker:gc:start',
      'worker:gc:error', 'worker:gc:complete'
    ]
    var invocations = 0

    events.forEach(function(event) {
      processService.on(event, function() {
        invocations++

        if(invocations == events.length) {
          done()
        }
      })
    })

    events.forEach(function(event) {
      childProcess.emit(event)
    })
  })

  it('should update number of cluster workers event', function() {
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
    processService._freeport.callsArgWith(0, undefined, 5)
    processService._child_process.fork.returns(childProcess)
    processService._processInfoStore.create.callsArgWith(1, undefined, processInfo)
    processService.startProcess(__filename, {}, sinon.stub())

    expect(processInfo.instances).to.equal(2)

    childProcess.emit('cluster:workers', 5)

    expect(processInfo.instances).to.equal(5)
  })

  it('should forward event when process exits cleanly', function(done) {
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
    processService._freeport.callsArgWith(0, undefined, 5)
    processService._child_process.fork.returns(childProcess)
    processService._processInfoStore.create.callsArgWith(1, undefined, processInfo)
    processService.startProcess(__filename, {}, sinon.stub())
    processService._processInfoStore.find.withArgs('id', processInfo.id).returns(processInfo)

    processService.on('process:exit', function(info) {
      expect(info).to.equal(processInfo)

      done()
    })

    childProcess.emit('exit', 0)

    expect(processInfo.status).to.equal('stopped')
  })

  it('should only emit process exit once if error and exit are both fired', function() {
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
    processService._freeport.callsArgWith(0, undefined, 5)
    processService._child_process.fork.returns(childProcess)
    processService._processInfoStore.create.callsArgWith(1, undefined, processInfo)
    processService.startProcess(__filename, {}, sinon.stub())
    processService._processInfoStore.find.withArgs('id', processInfo.id).onFirstCall().returns(processInfo)

    var invoked = 0

    processService.on('process:exit', function(info) {
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
})
