var expect = require('chai').expect,
  sinon = require('sinon'),
  EventEmitter = require('events').EventEmitter,
  Processes = require('../../lib/Processes')

describe('Processes', function() {
  var processes, boss, info

  beforeEach(function() {
    info = console.info
    console.info = sinon.stub()

    processes = new Processes()
    processes._config = {
      boss: {

      }
    }
    processes._logger = {
      info: sinon.stub(),
      warn: sinon.stub(),
      error: sinon.stub(),
      debug: sinon.stub()
    }
    processes._connect = sinon.stub()
    processes._moment = {
      duration: sinon.stub(),
      humanize: sinon.stub()
    }
    processes._formatMemory = sinon.stub()
    processes._fs = {
      existsSync: sinon.stub()
    }

    boss = new EventEmitter()
    boss.disconnect = sinon.stub()
    boss.findProcessInfoByPid = sinon.stub()
    boss.findProcessInfoByName = sinon.stub()
    boss.connectToProcess = sinon.stub()

    processes._connect.callsArgWith(0, undefined, boss)
  })

  afterEach(function() {
    console.info = info
  })

  it('should list processes', function() {
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

    boss.listProcesses = sinon.stub()
    boss.listProcesses.withArgs(sinon.match.func).callsArgWith(0, undefined, processList)

    processes._moment.duration.returns(processes._moment)

    processes.list()

    expect(boss.disconnect.called).to.be.true
    expect(console.info.called).to.be.true
  })

  it('should not throw formatting process list with undefined values', function() {
    var processList = [{}]

    boss.listProcesses = sinon.stub()
    boss.listProcesses.withArgs(sinon.match.func).callsArgWith(0, undefined, processList)

    processes.list()

    expect(boss.listProcesses.threw()).to.be.false
  })

  it('should not throw formatting process list with null values', function() {
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

    boss.listProcesses = sinon.stub()
    boss.listProcesses.withArgs(sinon.match.func).callsArgWith(0, undefined, processList)

    processes.list()

    expect(boss.listProcesses.threw()).to.be.false
  })

  it('should not throw formatting process list with non-numeric values', function() {
    // Set properties that require extra numeric formatting to non-numeric objects
    var processList = [{
      uptime: 'uptime',
      rss: 'rss',
      heapTotal: 'heapTotal',
      heapUsed: 'heapUsed',
      cpu: 'cpu'
    }]

    boss.listProcesses = sinon.stub()
    boss.listProcesses.withArgs(sinon.match.func).callsArgWith(0, undefined, processList)

    processes.list()

    expect(boss.listProcesses.threw()).to.be.false
  })

  it('should start a process', function() {
    var script = 'script'
    var options = {}
    var processInfo = {
      id: 'id'
    }

    processes._fs.existsSync.withArgs(script).returns(true)
    boss.startProcess = sinon.stub()
    boss.startProcess.callsArgWith(2, undefined, processInfo)

    processes.start(script, options)

    boss.emit('process:ready', processInfo)

    expect(boss.disconnect.called).to.be.true
  })

  it('should stop a process', function() {
    var pid = 'pid'
    var processInfo = {
      id: 'id'
    }
    var remote = {
      kill: sinon.stub(),
      disconnect: sinon.stub()
    }

    boss.findProcessInfoByName.withArgs(pid).callsArgWith(1, undefined, processInfo)
    boss.connectToProcess.withArgs(processInfo.id).callsArgWith(1, undefined, remote)

    processes.stop(pid)

    expect(boss.disconnect.called).to.be.true
    expect(remote.kill.called).to.be.true
    expect(remote.disconnect.called).to.be.true
  })

  it('should stop multiple processes', function() {
    var pid0 = 'pid0'
    var processInfo0 = {
      id: 'id0'
    }

    var pid1 = 'pid1'
    var processInfo1 = {
      id: 'id1'
    }

    var remote0 = {
      kill: sinon.stub(),
      disconnect: sinon.stub()
    }

    var remote1 = {
      kill: sinon.stub(),
      disconnect: sinon.stub()
    }

    boss.findProcessInfoByName.withArgs(pid0).callsArgWith(1, undefined, processInfo0)
    boss.connectToProcess.withArgs(processInfo0.id).callsArgWith(1, undefined, remote0)

    boss.findProcessInfoByName.withArgs(pid1).callsArgWith(1, undefined, processInfo1)
    boss.connectToProcess.withArgs(processInfo1.id).callsArgWith(1, undefined, remote1)

    processes.stop([pid0, pid1])

    expect(boss.disconnect.called).to.be.true
    expect(remote0.kill.called).to.be.true
    expect(remote0.disconnect.called).to.be.true
    expect(remote1.kill.called).to.be.true
    expect(remote1.disconnect.called).to.be.true
  })

  it('should stop all processes', function() {
    var processList = [{
      pid: 'pid0',
      id: 'id0'
    }, {
      pid: 'pid1',
      id: 'id1'
    }]

    var remote0 = {
      kill: sinon.stub(),
      disconnect: sinon.stub()
    }

    var remote1 = {
      kill: sinon.stub(),
      disconnect: sinon.stub()
    }

    boss.listProcesses = sinon.stub()
    boss.listProcesses.withArgs(sinon.match.func).callsArgWith(0, undefined, processList)

    boss.findProcessInfoByName.withArgs(processList[0].pid).callsArgWith(1, undefined, processList[0])
    boss.connectToProcess.withArgs(processList[0].id).callsArgWith(1, undefined, remote0)

    boss.findProcessInfoByName.withArgs(processList[1].pid).callsArgWith(1, undefined, processList[1])
    boss.connectToProcess.withArgs(processList[1].id).callsArgWith(1, undefined, remote1)

    processes.stop('all')

    expect(boss.disconnect.called).to.be.true
    expect(remote0.kill.called).to.be.true
    expect(remote0.disconnect.called).to.be.true
    expect(remote1.kill.called).to.be.true
    expect(remote1.disconnect.called).to.be.true
  })

  it('should restart a process', function() {
    var pid = 'pid'
    var processInfo = {
      id: 'id'
    }
    var remote = {
      restart: sinon.stub(),
      disconnect: sinon.stub()
    }

    boss.findProcessInfoByName.withArgs(pid).callsArgWith(1, undefined, processInfo)
    boss.connectToProcess.withArgs(processInfo.id).callsArgWith(1, undefined, remote)

    processes.restart(pid)

    expect(boss.disconnect.called).to.be.true
    expect(remote.restart.called).to.be.true
    expect(remote.disconnect.called).to.be.true
  })

  it('should restart multiple processes', function() {
    var pid0 = 'pid0'
    var processInfo0 = {
      id: 'id0'
    }

    var pid1 = 'pid1'
    var processInfo1 = {
      id: 'id1'
    }

    var remote0 = {
      restart: sinon.stub(),
      disconnect: sinon.stub()
    }

    var remote1 = {
      restart: sinon.stub(),
      disconnect: sinon.stub()
    }

    boss.findProcessInfoByName.withArgs(pid0).callsArgWith(1, undefined, processInfo0)
    boss.connectToProcess.withArgs(processInfo0.id).callsArgWith(1, undefined, remote0)

    boss.findProcessInfoByName.withArgs(pid1).callsArgWith(1, undefined, processInfo1)
    boss.connectToProcess.withArgs(processInfo1.id).callsArgWith(1, undefined, remote1)

    processes.restart([pid0, pid1])

    expect(boss.disconnect.called).to.be.true
    expect(remote0.restart.called).to.be.true
    expect(remote0.disconnect.called).to.be.true
    expect(remote1.restart.called).to.be.true
    expect(remote1.disconnect.called).to.be.true
  })

  it('should restart all processes', function() {
    var processList = [{
      pid: 'pid0',
      id: 'id0'
    }, {
      pid: 'pid1',
      id: 'id1'
    }]

    var remote0 = {
      restart: sinon.stub(),
      disconnect: sinon.stub()
    }

    var remote1 = {
      restart: sinon.stub(),
      disconnect: sinon.stub()
    }

    boss.listProcesses = sinon.stub()
    boss.listProcesses.withArgs(sinon.match.func).callsArgWith(0, undefined, processList)

    boss.findProcessInfoByName.withArgs(processList[0].pid).callsArgWith(1, undefined, processList[0])
    boss.connectToProcess.withArgs(processList[0].id).callsArgWith(1, undefined, remote0)

    boss.findProcessInfoByName.withArgs(processList[1].pid).callsArgWith(1, undefined, processList[1])
    boss.connectToProcess.withArgs(processList[1].id).callsArgWith(1, undefined, remote1)

    processes.restart('all')

    expect(boss.disconnect.called).to.be.true
    expect(remote0.restart.called).to.be.true
    expect(remote0.disconnect.called).to.be.true
    expect(remote1.restart.called).to.be.true
    expect(remote1.disconnect.called).to.be.true
  })

  it('should send a message to a process', function() {
    var pid = 'pid'
    var event = 'foo:bar'
    var args = ['one', 'two', 'three']
    var processInfo = {
      id: 'id'
    }
    var remote = {
      send: sinon.stub(),
      disconnect: sinon.stub()
    }

    boss.findProcessInfoByName.withArgs(pid).callsArgWith(1, undefined, processInfo)
    boss.connectToProcess.withArgs(processInfo.id).callsArgWith(1, undefined, remote)

    processes.send(pid, event, args)

    expect(boss.disconnect.called).to.be.true
    expect(remote.send.calledWith(event, args[0], args[1], args[2])).to.be.true
    expect(remote.disconnect.called).to.be.true
  })

  it('should send a signal to a process', function() {
    var pid = 'pid'
    var signal = 'signal'
    var processInfo = {
      id: 'id'
    }

    boss.findProcessInfoByName.withArgs(pid).callsArgWith(1, undefined, processInfo)
    boss.sendSignal = sinon.stub()
    boss.sendSignal.withArgs(processInfo.id, signal, sinon.match.func).callsArgWith(2, undefined)

    processes.signal(pid, signal)

    expect(boss.disconnect.called).to.be.true
    expect(boss.sendSignal.calledWith(processInfo.id, signal, sinon.match.func)).to.be.true
  })

  it('should make a process dump heap', function() {
    var pid = 'pid'
    var path = 'path'
    var processInfo = {
      id: 'id'
    }
    var remote = {
      dumpHeap: sinon.stub(),
      disconnect: sinon.stub()
    }
    remote.dumpHeap.callsArgWith(0, undefined, path)

    boss.findProcessInfoByName.withArgs(pid).callsArgWith(1, undefined, processInfo)
    boss.connectToProcess.withArgs(processInfo.id).callsArgWith(1, undefined, remote)

    processes.heapdump(pid)

    expect(boss.disconnect.called).to.be.true
    expect(remote.dumpHeap.calledWith(sinon.match.func)).to.be.true
    expect(remote.disconnect.called).to.be.true
    expect(console.info.calledWith(sinon.match.string, path)).to.be.true
  })

  it('should make a process garbage collect', function() {
    var pid = 'pid'
    var processInfo = {
      id: 'id'
    }
    var remote = {
      forceGc: sinon.stub(),
      disconnect: sinon.stub()
    }
    remote.forceGc.callsArgWith(0, undefined)

    boss.findProcessInfoByName.withArgs(pid).callsArgWith(1, undefined, processInfo)
    boss.connectToProcess.withArgs(processInfo.id).callsArgWith(1, undefined, remote)

    processes.gc(pid)

    expect(boss.disconnect.called).to.be.true
    expect(remote.forceGc.calledWith(sinon.match.func)).to.be.true
    expect(remote.disconnect.called).to.be.true
  })

  it('should find a process by pid if the passed id is numeric', function() {
    var pid = 5
    var signal = 'signal'
    var processInfo = {
      id: 'id'
    }

    boss.findProcessInfoByPid.withArgs(pid).callsArgWith(1, undefined, processInfo)
    boss.sendSignal = sinon.stub()
    boss.sendSignal.withArgs(processInfo.id, signal, sinon.match.func).callsArgWith(2, undefined)

    processes.signal(pid, signal)

    expect(boss.disconnect.called).to.be.true
    expect(boss.sendSignal.calledWith(processInfo.id, signal, sinon.match.func)).to.be.true
  })
})
