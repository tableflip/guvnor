var expect = require('chai').expect,
  sinon = require('sinon'),
  path = require('path'),
  Daemon = require('../../../lib/cli/Daemon'),
  EventEmitter = require('events').EventEmitter

describe('Daemon', function () {
  var daemon, guvnor, info

  beforeEach(function () {
    info = console.info

    daemon = new Daemon()
    daemon._config = {
      guvnor: {

      }
    }
    daemon._logger = {
      info: sinon.stub(),
      warn: sinon.stub(),
      error: sinon.stub(),
      debug: sinon.stub()
    }
    daemon._running = sinon.stub()
    daemon._connectOrStart = sinon.stub()

    guvnor = {
      disconnect: sinon.stub(),
      on: sinon.stub(),
      findProcessInfoByPid: sinon.stub(),
      connectToProcess: sinon.stub(),
      listProcesses: sinon.stub()
    }

    daemon._connectOrStart.callsArgWith(0, undefined, guvnor)
  })

  afterEach(function () {
    console.info = info
  })

  it('should return config option', function (done) {
    daemon._config = {
      foo: 'bar'
    }

    console.info = function (result) {
      expect(result).to.equal('bar')

      done()
    }

    daemon.config('foo')
  })

  it('should return nested config option', function (done) {
    daemon._config = {
      bar: {
        baz: 'foo'
      }
    }

    console.info = function (result) {
      expect(result).to.equal('foo')

      done()
    }

    daemon.config('bar.baz')
  })

  it('should be able to find out if guvnor is running', function (done) {
    console.info = function (result) {
      expect(result).to.contain('is running')

      done()
    }

    daemon._running.callsArgWith(0, true)

    daemon.status()
  })

  it('should be able to find out if guvnor is not running', function (done) {
    console.info = function (result) {
      expect(result).to.contain('is not running')

      done()
    }

    daemon._running.callsArgWith(0, false)

    daemon.status()
  })

  it('should kill the daemon if the daemon is running', function () {
    daemon._running.callsArgWith(0, true)
    guvnor.kill = sinon.stub()

    var options = {}

    daemon.kill(options)

    expect(guvnor.kill.called).to.be.true
    expect(guvnor.disconnect.called).to.be.true
  })

  it("should not kill the daemon if it's not running", function () {
    daemon._running.callsArgWith(0, false)
    guvnor.kill = sinon.stub()

    var options = {}

    daemon.kill(options)

    expect(guvnor.kill.called).to.be.false
  })

  it('should not kill the daemon if args are specified', function () {
    var pid = 0
    guvnor.kill = sinon.stub()

    var options = {}

    daemon.kill(pid, options)

    expect(guvnor.kill.called).to.be.false
  })

  it('should relay all logs', function () {
    var processes = [{
      on: sinon.stub()
    }, {
      on: sinon.stub()
    }]

    guvnor.listProcesses.callsArgWith(0, undefined, processes)

    daemon.logs(undefined, {})

    // should be listening for all logs
    expect(processes[0].on.callCount).to.equal(8)
    expect(processes[1].on.callCount).to.equal(8)

    console.info = sinon.stub()
    expect(console.info.callCount).to.equal(0)

    expect(processes[0].on.getCall(1).args[0]).to.equal('process:log:info')
    processes[0].on.getCall(1).args[1]({
      message: 'foo',
      date: 'date'
    })

    expect(console.info.callCount).to.equal(1)
  })

  it('should relay logs for one pid', function () {
    var pid = 5
    var processes = [{
      on: sinon.stub(),
      pid: pid
    }, {
      on: sinon.stub(),
      pid: pid + 1
    }]

    guvnor.listProcesses.callsArgWith(0, undefined, processes)

    daemon.logs(pid, {})

    // should only be watching the first process for log events
    expect(processes[0].on.callCount).to.equal(8)
    expect(processes[1].on.callCount).to.equal(0)

    expect(processes[0].on.getCall(0).args[0]).to.equal('process:log:error')
    expect(processes[0].on.getCall(1).args[0]).to.equal('process:log:info')
    expect(processes[0].on.getCall(2).args[0]).to.equal('process:log:warn')
    expect(processes[0].on.getCall(3).args[0]).to.equal('process:log:debug')
    expect(processes[0].on.getCall(4).args[0]).to.equal('worker:log:error')
    expect(processes[0].on.getCall(5).args[0]).to.equal('worker:log:info')
    expect(processes[0].on.getCall(6).args[0]).to.equal('worker:log:warn')
    expect(processes[0].on.getCall(7).args[0]).to.equal('worker:log:debug')
  })

  it('should dump processes', function () {
    guvnor.dumpProcesses = sinon.stub()
    guvnor.dumpProcesses.callsArg(0)

    daemon.dump({})

    expect(guvnor.disconnect.called).to.be.true
  })

  it('should fail to dump processes', function () {
    guvnor.dumpProcesses = sinon.stub()
    guvnor.dumpProcesses.callsArgWith(0, new Error('urk!'))

    try {
      daemon.dump({})
    } catch (error) {
      if (error.message != 'urk!')
        throw error
    }
  })

  it('should restore processes', function () {
    guvnor.restoreProcesses = sinon.stub()
    guvnor.restoreProcesses.callsArg(0)

    daemon.restore({})

    expect(guvnor.disconnect.called).to.be.true
  })

  it('should fail to restore processes', function () {
    guvnor.restoreProcesses = sinon.stub()
    guvnor.restoreProcesses.callsArgWith(0, new Error('urk!'))

    try {
      daemon.restore({})
    } catch (error) {
      if (error.message != 'urk!')
        throw error
    }
  })
})
