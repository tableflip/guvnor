var expect = require('chai').expect,
  sinon = require('sinon'),
  Actions = require('../../lib/Actions')

describe('Actions', function() {
  var actions, boss, info, error, warn

  beforeEach(function() {
    info = console.info
    error = console.error
    warn = console.warn

    actions = new Actions()
    actions._config = {
      boss: {

      }
    }
    actions._logger = {
      info: sinon.stub(),
      warn: sinon.stub(),
      error: sinon.stub(),
      debug: sinon.stub()
    }
    actions._connect = sinon.stub()
    actions._user = {}
    actions._group = {}

    boss = {
      disconnect: sinon.stub(),
      on: sinon.stub(),
      findProcessInfoByPid: sinon.stub(),
      connectToProcess: sinon.stub()
    }

    actions._connect.callsArgWith(0, undefined, boss)
  })

  afterEach(function() {
    console.info = info
    console.error = error
    console.warn = warn
  })

  it('should parse start process options', function() {
    actions._user.name = 'user'
    actions._group.name = 'user'

    var options = actions._parseStartProcessOpts({})

    expect(options.user).to.equal(actions._user.name)
    expect(options.group).to.equal(actions._group.name)
    expect(options.instances).to.not.exist
    expect(options.name).to.not.exist
    expect(options.argv).to.not.exist
    expect(options.execArgv).to.not.exist
    expect(options.debug).to.not.exist
    expect(options.env).to.be.ok
  })

  it('should connect', function(done) {
    actions._do({}, function(bs) {
      expect(bs).to.equal(boss)

      done()
    })
  })

  it('should fail to connect', function() {
    actions._connect = sinon.stub()
    actions._connect.callsArgWith(0, new Error('urk!'))

    try {
      actions._do()
    } catch(error) {
      if(error.message != 'urk!') throw error
    }
  })

  it('should check for admin method', function(done) {
    boss.superAdminMethod = sinon.stub()

    actions._doAdmin('superAdminMethod', {}, function(bs) {
      expect(bs).to.equal(boss)

      done()
    })
  })

  it('should not find admin method', function() {
    actions._doAdmin('superAdminMethod', {})

    expect(actions._logger.warn.callCount).to.equal(1)
    expect(boss.disconnect.called).to.be.true
  })

  it('should log boss messages', function() {
    var boss = {
      on: sinon.stub()
    }

    actions._logBossMessages(boss)

    expect(boss.on.callCount).to.equal(1)
    expect(boss.on.getCall(0).args[0]).to.equal('*')

    expect(actions._logger.debug.called).to.be.false

    boss.on.getCall(0).args[1]('foo', 'bar')

    expect(actions._logger.debug.called).to.be.true
  })

  it('should connect to a remote process', function(done) {
    var pid = 5
    var processInfo = {
      id: 'id'
    }
    var boss = {
      findProcessInfoByPid: sinon.stub(),
      connectToProcess: sinon.stub()
    }
    var remote = {

    }
    boss.findProcessInfoByPid.withArgs(pid).callsArgWith(1, undefined, processInfo)
    boss.connectToProcess.withArgs(processInfo.id).callsArgWith(1, undefined, remote)

    actions._withRemoteProcess(boss, pid, function(error, p, r) {
      expect(error).to.not.exist
      expect(p).to.equal(processInfo)
      expect(r).to.equal(remote)

      done()
    })
  })

  it('should survive not accessing a remote process', function() {
    var pid = 5
    var processInfo = {
      id: 'id'
    }
    var boss = {
      findProcessInfoByPid: sinon.stub(),
      connectToProcess: sinon.stub()
    }
    boss.findProcessInfoByPid.withArgs(pid).callsArgWith(1, undefined, processInfo)
    boss.connectToProcess.withArgs(processInfo.id).callsArgWith(1, {code: 'EACCES'})

    actions._withRemoteProcess(boss, pid, function(error) {
      expect(error).to.exist
      expect(error.code).to.equal('EACCES')
    })
  })

  it('should survive not accessing a non-existent process', function() {
    var pid = 5
    var processInfo = {
      id: 'id'
    }
    var boss = {
      findProcessInfoByPid: sinon.stub(),
      connectToProcess: sinon.stub()
    }
    boss.findProcessInfoByPid.withArgs(pid).callsArgWith(1, undefined, processInfo)
    boss.connectToProcess.withArgs(processInfo.id).callsArgWith(1, {code: 'ENOENT'})

    actions._withRemoteProcess(boss, pid, function(error) {
      expect(error).to.exist
      expect(error.code).to.equal('ENOENT')
    })
  })

  it('should survive not accessing a dead or crashed process', function() {
    var pid = 5
    var processInfo = {
      id: 'id'
    }
    var boss = {
      findProcessInfoByPid: sinon.stub(),
      connectToProcess: sinon.stub()
    }
    boss.findProcessInfoByPid.withArgs(pid).callsArgWith(1, undefined, processInfo)
    boss.connectToProcess.withArgs(processInfo.id).callsArgWith(1, {code: 'ECONNREFUSED'})

    actions._withRemoteProcess(boss, pid, function(error) {
      expect(error).to.exist
      expect(error.code).to.equal('ECONNREFUSED')
    })
  })
})
