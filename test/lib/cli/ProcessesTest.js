var expect = require('chai').expect,
  sinon = require('sinon'),
  EventEmitter = require('events').EventEmitter,
  Processes = require('../../../lib/cli/Processes'),
  path = require('path')

describe('Processes', function () {
  var processes, guvnor, info

  beforeEach(function () {
    info = console.info
    console.info = sinon.stub()

    processes = new Processes()
    processes._config = {
      guvnor: {}
    }
    processes._logger = {
      info: sinon.stub(),
      warn: sinon.stub(),
      error: sinon.stub(),
      debug: sinon.stub()
    }
    processes._connectOrStart = sinon.stub()
    processes._moment = {
      duration: sinon.stub(),
      humanize: sinon.stub()
    }
    processes._formatMemory = sinon.stub()
    processes._fs = {
      existsSync: sinon.stub()
    }

    guvnor = new EventEmitter()
    guvnor.disconnect = sinon.stub()
    guvnor.findProcessInfoByPid = sinon.stub()
    guvnor.findProcessInfoByName = sinon.stub()
    guvnor.connectToProcess = sinon.stub()
    guvnor.listProcesses = sinon.stub()
    guvnor.removeProcess = sinon.stub()

    processes._connectOrStart.callsArgWith(0, undefined, guvnor)
  })

  afterEach(function () {
    console.info = info
  })

  it('should list processes', function () {
    var processList = [{
      pid: 'pid',
      user: 'user',
      group: 'group',
      name: 'name',
      uptime: 'uptime',
      restarts: 'restarts',
      rss: 'rss',
      heapTotal: 'heapTotal',
      heapUsed: 'heapUsed',
      cpu: 'cpu',
      status: 'status'
    }]

    guvnor.listProcesses = sinon.stub()
    guvnor.listProcesses.withArgs(sinon.match.func).callsArgWith(0, undefined, processList)

    processes._moment.duration.returns(processes._moment)

    processes.list()

    expect(guvnor.disconnect.called).to.be.true
    expect(console.info.called).to.be.true
  })

  it('should not throw formatting process list with undefined values', function () {
    var processList = [{}]

    guvnor.listProcesses = sinon.stub()
    guvnor.listProcesses.withArgs(sinon.match.func).callsArgWith(0, undefined, processList)

    processes.list()

    expect(guvnor.listProcesses.threw()).to.be.false
  })

  it('should not throw formatting process list with null values', function () {
    var processList = [{
      pid: null,
      user: null,
      group: null,
      name: null,
      uptime: null,
      restarts: null,
      rss: null,
      heapTotal: null,
      heapUsed: null,
      cpu: null,
      status: null
    }]

    guvnor.listProcesses = sinon.stub()
    guvnor.listProcesses.withArgs(sinon.match.func).callsArgWith(0, undefined, processList)

    processes.list()

    expect(guvnor.listProcesses.threw()).to.be.false
  })

  it('should not throw formatting process list with non-numeric values', function () {
    // Set properties that require extra numeric formatting to non-numeric objects
    var processList = [{
      uptime: 'uptime',
      rss: 'rss',
      heapTotal: 'heapTotal',
      heapUsed: 'heapUsed',
      cpu: 'cpu'
    }]

    guvnor.listProcesses = sinon.stub()
    guvnor.listProcesses.withArgs(sinon.match.func).callsArgWith(0, undefined, processList)

    processes.list()

    expect(guvnor.listProcesses.threw()).to.be.false
  })

  it('should start a process', function () {
    var script = 'script'
    var options = {}
    var processInfo = new EventEmitter()
    processInfo.id = 'id'

    processes._fs.existsSync.withArgs(script).returns(true)
    guvnor.startProcess = sinon.stub()
    guvnor.startProcess.callsArgWith(2, undefined, processInfo)

    processes.start(script, options)

    processInfo.emit('process:ready')

    expect(guvnor.disconnect.called).to.be.true
  })

  it('should stop a process', function () {
    var name = 'name'
    var managedProcess = {
      name: name,
      kill: sinon.stub().callsArg(0),
      disconnect: sinon.stub().callsArg(0)
    }

    guvnor.listProcesses.callsArgWith(0, undefined, [
      managedProcess
    ])

    processes.stop(name)

    expect(guvnor.disconnect.called).to.be.true
    expect(managedProcess.kill.called).to.be.true
    expect(managedProcess.disconnect.called).to.be.true
  })

  it('should stop multiple processes by pid', function () {
    var pid0 = 1
    var pid1 = 2
    var managedProcesses = [{
      pid: pid0,
      kill: sinon.stub().callsArg(0),
      disconnect: sinon.stub().callsArg(0)
    }, {
      pid: pid1,
      kill: sinon.stub().callsArg(0),
      disconnect: sinon.stub().callsArg(0)
    }]

    guvnor.listProcesses.callsArgWith(0, undefined, managedProcesses)

    processes.stop([pid0, pid1])

    expect(guvnor.disconnect.calledOnce).to.be.true
    expect(managedProcesses[0].kill.calledOnce).to.be.true
    expect(managedProcesses[0].disconnect.calledOnce).to.be.true
    expect(managedProcesses[1].kill.calledOnce).to.be.true
    expect(managedProcesses[1].disconnect.calledOnce).to.be.true
  })

  it('should stop multiple processes by name', function () {
    var name0 = 'foo'
    var name1 = 'bar'
    var managedProcesses = [{
      name: name0,
      kill: sinon.stub().callsArg(0),
      disconnect: sinon.stub().callsArg(0)
    }, {
      name: name1,
      kill: sinon.stub().callsArg(0),
      disconnect: sinon.stub().callsArg(0)
    }]

    guvnor.listProcesses.callsArgWith(0, undefined, managedProcesses)

    processes.stop([name0, name1])

    expect(guvnor.disconnect.calledOnce).to.be.true
    expect(managedProcesses[0].kill.calledOnce).to.be.true
    expect(managedProcesses[0].disconnect.calledOnce).to.be.true
    expect(managedProcesses[1].kill.calledOnce).to.be.true
    expect(managedProcesses[1].disconnect.calledOnce).to.be.true
  })

  it('should stop multiple processes by wildcard', function () {
    var name0 = 'foo'
    var name1 = 'bar'
    var managedProcesses = [{
      name: name0,
      kill: sinon.stub().callsArg(0),
      disconnect: sinon.stub().callsArg(0)
    }, {
      name: name1,
      kill: sinon.stub().callsArg(0),
      disconnect: sinon.stub().callsArg(0)
    }]

    guvnor.listProcesses.callsArgWith(0, undefined, managedProcesses)

    processes.stop('*')

    expect(guvnor.disconnect.calledOnce).to.be.true
    expect(managedProcesses[0].kill.calledOnce).to.be.true
    expect(managedProcesses[0].disconnect.calledOnce).to.be.true
    expect(managedProcesses[1].kill.calledOnce).to.be.true
    expect(managedProcesses[1].disconnect.calledOnce).to.be.true
  })

  it('should restart a process', function () {
    var name = 'name'
    var managedProcess = {
      name: name,
      restart: sinon.stub().callsArg(0),
      disconnect: sinon.stub().callsArg(0)
    }

    guvnor.listProcesses.callsArgWith(0, undefined, [
      managedProcess
    ])

    processes.restart(name)

    expect(guvnor.disconnect.called).to.be.true
    expect(managedProcess.restart.called).to.be.true
    expect(managedProcess.disconnect.called).to.be.true
  })

  it('should send an event to a process', function () {
    var name = 'name'
    var event = 'foo:bar'
    var args = ['one', 'two', 'three']
    var managedProcess = {
      name: name,
      send: sinon.stub().callsArg(4),
      disconnect: sinon.stub().callsArg(0)
    }

    guvnor.listProcesses.callsArgWith(0, undefined, [
      managedProcess
    ])

    processes.send(name, event, args)

    expect(guvnor.disconnect.called).to.be.true
    expect(managedProcess.send.calledWith(event, args[0], args[1], args[2], sinon.match.func)).to.be.true
    expect(managedProcess.disconnect.called).to.be.true
  })

  it('should send a signal to a process', function () {
    var name = 'name'
    var signal = 'signal'
    var managedProcess = {
      id: 'foo',
      name: name,
      signal: sinon.stub().callsArg(1),
      disconnect: sinon.stub().callsArg(0)
    }

    guvnor.listProcesses.callsArgWith(0, undefined, [
      managedProcess
    ])

    processes.signal(name, signal)

    expect(managedProcess.signal.calledWith(signal, sinon.match.func)).to.be.true
    expect(guvnor.disconnect.called).to.be.true
  })

  it('should make a process dump heap', function () {
    var name = 'name'
    var path = 'path'
    var managedProcess = {
      name: name,
      dumpHeap: sinon.stub().callsArgWith(0, undefined, path),
      disconnect: sinon.stub().callsArg(0)
    }

    guvnor.listProcesses.callsArgWith(0, undefined, [
      managedProcess
    ])

    processes.heapdump(name)

    expect(guvnor.disconnect.called).to.be.true
    expect(managedProcess.dumpHeap.called).to.be.true
    expect(managedProcess.disconnect.called).to.be.true
    expect(console.info.calledWith(sinon.match.string, path)).to.be.true
  })

  it('should make a process garbage collect', function () {
    var name = 'name'
    var managedProcess = {
      name: name,
      forceGc: sinon.stub().callsArg(0),
      disconnect: sinon.stub().callsArg(0)
    }

    guvnor.listProcesses.callsArgWith(0, undefined, [
      managedProcess
    ])

    processes.gc(name)

    expect(guvnor.disconnect.called).to.be.true
    expect(managedProcess.forceGc.called).to.be.true
    expect(managedProcess.disconnect.called).to.be.true
  })

  it('should remove a process', function () {
    var name = 'name'
    var signal = 'signal'
    var managedProcess = {
      id: 'id',
      name: name,
      kill: sinon.stub().callsArg(0)
    }

    guvnor.listProcesses.callsArgWith(0, undefined, [
      managedProcess
    ])

    guvnor.disconnect.callsArg(0)
    guvnor.removeProcess.callsArg(1)

    processes.remove(name)

    expect(guvnor.disconnect.called).to.be.true
    expect(guvnor.removeProcess.calledWith(managedProcess.id, sinon.match.func)).to.be.true
  })

  it('should start guvnor-web', function () {
    var script = path.resolve(__dirname + '/../../lib/web')
    var options = {}
    var processInfo = new EventEmitter()

    processes._fs.existsSync.withArgs(script).returns(true)
    guvnor.startProcess = sinon.stub()
    guvnor.startProcess.callsArgWith(2, undefined, processInfo)

    processes.startWebMonitor(options)

    processInfo.emit('process:ready')

    expect(guvnor.disconnect.called).to.be.true
    expect(guvnor.startProcess.getCall(0).args[1].name).to.equal('guvnor-web')
  })

  it('should use the admin socket to start a process as a different user', function () {
    var script = 'script'
    var options = {
      user: 'foo'
    }
    var processInfo = new EventEmitter()

    processes._fs.existsSync.withArgs(script).returns(true)
    guvnor.startProcessAsUser = sinon.stub()
    guvnor.startProcessAsUser.callsArgWith(2, undefined, processInfo)

    processes.start(script, options)

    processInfo.emit('process:ready', processInfo)

    expect(guvnor.disconnect.called).to.be.true
  })
})
