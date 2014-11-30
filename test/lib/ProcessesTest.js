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

    boss = new EventEmitter()
    boss.disconnect = sinon.stub()
    boss.findProcessInfoByPid = sinon.stub()
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

  it('should start a process', function() {
    var script = 'script'
    var options = {}
    var processInfo = {
      id: 'id'
    }

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

    boss.findProcessInfoByPid.withArgs(pid).callsArgWith(1, undefined, processInfo)
    boss.connectToProcess.withArgs(processInfo.id).callsArgWith(1, undefined, remote)

    processes.stop(pid)

    expect(boss.disconnect.called).to.be.true
    expect(remote.kill.called).to.be.true
    expect(remote.disconnect.called).to.be.true
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

    boss.findProcessInfoByPid.withArgs(pid).callsArgWith(1, undefined, processInfo)
    boss.connectToProcess.withArgs(processInfo.id).callsArgWith(1, undefined, remote)

    processes.restart(pid)

    expect(boss.disconnect.called).to.be.true
    expect(remote.restart.called).to.be.true
    expect(remote.disconnect.called).to.be.true
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

    boss.findProcessInfoByPid.withArgs(pid).callsArgWith(1, undefined, processInfo)
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

    boss.findProcessInfoByPid.withArgs(pid).callsArgWith(1, undefined, processInfo)
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

    boss.findProcessInfoByPid.withArgs(pid).callsArgWith(1, undefined, processInfo)
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

    boss.findProcessInfoByPid.withArgs(pid).callsArgWith(1, undefined, processInfo)
    boss.connectToProcess.withArgs(processInfo.id).callsArgWith(1, undefined, remote)

    processes.gc(pid)

    expect(boss.disconnect.called).to.be.true
    expect(remote.forceGc.calledWith(sinon.match.func)).to.be.true
    expect(remote.disconnect.called).to.be.true
  })
})
