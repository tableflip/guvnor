var expect = require('chai').expect,
  sinon = require('sinon'),
  ProcessInfo = require('../../../../lib/daemon/domain/ProcessInfo'),
  posix = require('posix'),
  semver = require('semver'),
  path = require('path'),
  os = require('os')

describe('ProcessInfo', function () {
  var processInfo

  beforeEach(function() {
    processInfo = new ProcessInfo({
      script: 'foo.js'
    })
    processInfo._config = {
      guvnor: {
        logdir: 'foo'
      },
      debug: {
        cluster: false
      }
    }
    processInfo._logger = {
      info: sinon.stub(),
      warn: sinon.stub(),
      error: sinon.stub(),
      debug: sinon.stub(),
      log: sinon.stub(),
      remove: sinon.stub(),
      add: sinon.stub()
    }
    processInfo._child_process = {}
    processInfo._posix = {
      getpwnam: sinon.stub(),
      getgrnam: sinon.stub()
    }
    processInfo._fs = {
      stat: sinon.stub(),
      chown: sinon.stub(),
      exists: sinon.stub()
    }
    processInfo._fileSystem = {
      getLogDir: sinon.stub()
    }
    processInfo._semver = {
      gt: sinon.stub()
    }
  })

  it('should serialize and deserialize', function () {
    processInfo.script = '/foo/bar/baz.js'
    processInfo.cwd = '/foo/bar'
    processInfo._posix.getpwnam.returns({name: 'foo'})
    processInfo._posix.getgrnam.returns({name: 'bar'})

    var otherProcessInfo = new ProcessInfo(JSON.parse(JSON.stringify(processInfo)))
    otherProcessInfo._posix = {
      getpwnam: sinon.stub(),
      getgrnam: sinon.stub()
    }
    otherProcessInfo._fs = {
      stat: sinon.stub()
    }
    otherProcessInfo._config = {
      guvnor: {
        logdir: 'foo'
      }
    }
    otherProcessInfo._fileSystem = {
      getLogDir: sinon.stub()
    }
    otherProcessInfo._posix.getpwnam.returns({name: 'foo'})
    otherProcessInfo._posix.getgrnam.returns({name: 'bar'})

    for (var key in processInfo) {
      if (key == 'id' || key.substring(0, 1) == '_') {
        continue
      }

      expect(processInfo[key]).to.deep.equal(otherProcessInfo[key])
    }
  })

  it('should remove debug flags', function () {
    var processInfo = new ProcessInfo({
      script: '/foo/bar/baz.js',
      execArgv: [
        '--debug',
        '--debug=2398',
        '--debug-brk',
        '--debug-brk=3298'
      ]
    })

    expect(processInfo.execArgv).to.be.empty
  })

  it('should have default options', function () {
    delete processInfo.name

    processInfo._posix.getpwnam.returns({name: 'foo'})
    processInfo._posix.getgrnam.returns({name: 'bar'})
    processInfo._fs.stat.withArgs('/foo/bar/baz.js').returns({
      isDirectory: function () {
        return false
      }
    })
    processInfo.setOptions({
      script: '/foo/bar/baz.js'
    })

    expect(processInfo.name).to.equal('baz.js')
    expect(processInfo.restartOnError).to.be.true
    expect(processInfo.restartRetries).to.equal(5)
    expect(processInfo.argv).to.be.empty
    expect(processInfo.execArgv).to.be.empty
    expect(processInfo.env).to.be.ok
    expect(processInfo.debug).to.be.false
    expect(processInfo.instances).to.equal(1)
    expect(processInfo.cluster).to.be.false

    expect(processInfo.getProcessOptions().env.GUVNOR_SCRIPT).to.equal('/foo/bar/baz.js')
    expect(processInfo.getProcessOptions().env.GUVNOR_PROCESS_NAME).to.equal('baz.js')
  })

  it('should remove the old debug port', function () {
    processInfo.debug = true
    processInfo.debugPort = 6
    processInfo.execArgv = ['--debug=5', '--debug-brk=5']

    expect(processInfo.getProcessOptions().execArgv.indexOf('--debug=5')).to.equal(-1)
    expect(processInfo.getProcessOptions().execArgv.indexOf('--debug-brk=5')).to.equal(-1)
  })

  it('should update the debug port for processes', function () {
    processInfo.debug = true
    processInfo.debugPort = 5

    expect(processInfo.getProcessOptions().execArgv.indexOf('--debug-brk=5')).to.equal(0)
  })

  it('should not debug-brk cluster manager when config says not to', function () {
    processInfo._config.debug.cluster = false
    processInfo.debug = true
    processInfo.instances = 5
    processInfo.debugPort = 5
    processInfo.cluster = true

    expect(processInfo.getProcessOptions().execArgv).to.contain('--debug=5')
    expect(processInfo.getProcessOptions().execArgv).to.not.contain('--debug-brk=5')
  })

  it('should debug-brk cluster manager when config says to', function () {
    processInfo._config.debug.cluster = true
    processInfo.debug = true
    processInfo.instances = 5
    processInfo.debugPort = 5
    processInfo.cluster = true

    expect(processInfo.getProcessOptions().execArgv).to.not.contain('--debug=5')
    expect(processInfo.getProcessOptions().execArgv).to.contain('--debug-brk=5')
  })

  it('should not include default fields in simple object', function (done) {
    var processInfo = new ProcessInfo({
      script: 'test.js',
      user: 'foo',
      env: {
        NOT_IN_ENV: 'hello',
        IN_ENV: 'world'
      }
    })
    processInfo._child_process = {
      execFile: sinon.stub()
    }
    processInfo._config = {
      guvnor: {
        logdir: 'foo'
      },
      debug: {
        cluster: true
      }
    }
    processInfo._posix = {
      getpwnam: sinon.stub(),
      getgrnam: sinon.stub()
    }
    processInfo._fs = {
      stat: sinon.stub()
    }
    processInfo._fileSystem = {
      getLogDir: sinon.stub()
    }
    processInfo._posix.getpwnam.withArgs('foo').returns({name: 'foo'})
    processInfo._posix.getgrnam.returns({name: 'bar'})
    processInfo._fs.stat.withArgs('test.js').returns({
      isDirectory: function () {
        return false
      }
    })
    processInfo._child_process.execFile.withArgs('sudo', ['-u', 'foo', 'env']).callsArgWith(3, undefined, 'IN_ENV=world')

    processInfo.toSimpleObject(function (error, simple) {
      expect(error).to.not.exist

      // there are a few fields we don't want written out to disk
      expect(simple.id).not.to.exist
      expect(simple.pid).not.to.exist
      expect(simple.debugPort).not.to.exist
      expect(simple.restarts).not.to.exist
      expect(simple.totalRestarts).not.to.exist
      expect(simple.status).not.to.exist
      expect(simple.socket).not.to.exist
      expect(simple.debug).not.to.exist
      expect(simple.cluster).not.to.exist
      expect(simple.instances).not.to.exist
      expect(simple.cwd).not.to.exist
      expect(simple.argv).not.to.exist
      expect(simple.execArgv).not.to.exist
      expect(simple.restartOnError).not.to.exist
      expect(simple.restartRetries).not.to.exist
      expect(simple.crashRecoveryPeriod).not.to.exist
      expect(simple.name).not.to.exist
      expect(simple.env.NOT_IN_ENV).to.equal('hello')
      expect(simple.env.IN_ENV).not.to.exist

      done()
    })
  })

  it('should propagate environmental variables', function () {
    processInfo.env = {
      FOO: 'bar'
    }

    expect(processInfo.getProcessOptions().env.FOO).to.equal('bar')
  })

  it('should return args for process', function () {
    processInfo.argv = 'argv'

    expect(processInfo.getProcessArgs()).to.equal('argv')
  })

  it('should remove debug port from existing execArgv', function () {
    processInfo.execArgv = ['--debug', '--debug=5858', '--debug 5858', '--debug-brk=5858', '--debug-brk 5858', '--debug-port=5858', '--debug-port 5858']

    expect(processInfo.getProcessExecArgs().length).to.equal(1)
    expect(processInfo.getProcessExecArgs()).to.contain('--expose_gc')
  })

  it('should use --debug-port if on 0.11 or above', function () {
    processInfo.execArgv = []
    processInfo.debugPort = 5

    processInfo._semver.gt.returns(true)

    expect(processInfo.getProcessExecArgs().length).to.equal(2)
    expect(processInfo.getProcessExecArgs()).to.contain('--expose_gc')
    expect(processInfo.getProcessExecArgs()).to.contain('--debug-port=5')
  })

  it('should use --debug if on 0.10 or below', function () {
    processInfo.execArgv = []
    processInfo.debugPort = 5

    processInfo._semver.gt.returns(false)

    expect(processInfo.getProcessExecArgs().length).to.equal(2)
    expect(processInfo.getProcessExecArgs()).to.contain('--expose_gc')
    expect(processInfo.getProcessExecArgs()).to.contain('--debug=5')
  })

  it('should find a name from a package.json file', function () {
    expect(processInfo._findName(path.resolve(__dirname + '/../../../../index.js'))).to.equal('guvnor')
  })

  it('should set pid from process object', function () {
    var proc = {
      pid: 5,
      on: sinon.stub()
    }

    expect(processInfo.pid).to.not.exist

    processInfo.process = proc

    expect(processInfo.process).to.equal(proc)
    expect(processInfo.pid).to.equal(proc.pid)
  })

  it('should set process from worker object', function () {
    var worker = {
      process: {
        pid: 5,
        on: sinon.stub()
      }
    }

    expect(processInfo.pid).to.not.exist

    processInfo.worker = worker

    expect(processInfo.process).to.equal(worker.process)
    expect(processInfo.pid).to.equal(worker.process.pid)
    expect(processInfo.worker).to.equal(worker)
  })

  it('should remove pid when removing process object', function () {
    var proc = {
      pid: 5,
      on: sinon.stub()
    }

    expect(processInfo.pid).to.not.exist

    processInfo.process = proc

    expect(processInfo.pid).to.equal(proc.pid)

    processInfo.process = undefined

    expect(processInfo.pid).to.not.exist
  })

  it('should propagate process message events', function () {
    var proc = {
      pid: 5,
      on: sinon.stub(),
      emit: sinon.stub()
    }
    var event = {
      event: 'foo',
      args: ['bar']
    }

    processInfo.process = proc

    expect(proc.emit.called).to.be.false

    expect(proc.on.getCall(0).args[0]).to.equal('message')
    proc.on.getCall(0).args[1](event)

    expect(proc.emit.called).to.be.true
    expect(proc.emit.getCall(0).args).to.deep.equal(['foo', 'bar'])
  })

  it('should propagate process message events without args array', function () {
    var proc = {
      pid: 5,
      on: sinon.stub(),
      emit: sinon.stub()
    }
    var event = {
      event: 'foo'
    }

    processInfo.process = proc

    expect(proc.emit.called).to.be.false

    expect(proc.on.getCall(0).args[0]).to.equal('message')
    proc.on.getCall(0).args[1](event)

    expect(proc.emit.called).to.be.true
    expect(proc.emit.getCall(0).args).to.deep.equal(['foo'])
  })

  it('should ignore process message events without event object', function () {
    var proc = {
      pid: 5,
      on: sinon.stub(),
      emit: sinon.stub()
    }
    var event = 'foo'

    processInfo.process = proc

    expect(proc.on.getCall(0).args[0]).to.equal('message')
    proc.on.getCall(0).args[1](event)

    expect(proc.emit.called).to.be.false
  })

  it('should report as running if status is uninitialised, starting, started, running, restarting or stopping', function () {
    processInfo.status = 'foo'
    expect(processInfo.running).to.be.false

    processInfo.status = 'uninitialised'
    expect(processInfo.running).to.be.true

    processInfo.status = 'starting'
    expect(processInfo.running).to.be.true

    processInfo.status = 'started'
    expect(processInfo.running).to.be.true

    processInfo.status = 'running'
    expect(processInfo.running).to.be.true

    processInfo.status = 'restarting'
    expect(processInfo.running).to.be.true

    processInfo.status = 'stopping'
    expect(processInfo.running).to.be.true

    processInfo.status = 'stopped'
    expect(processInfo.running).to.be.false
  })

  it('should populate user and group via posix from passed parameters', function (done) {
    var user = 'foo'
    var group = 'bar'

    var userDetails = {
      name: user,
      uid: 5
    }

    var groupDetails = {
      name: group,
      gid: 6
    }

    processInfo.user = user
    processInfo.group = group

    processInfo._posix.getpwnam.withArgs(user).returns(userDetails)
    processInfo._posix.getgrnam.withArgs(group).returns(groupDetails)

    processInfo._checkUserAndGroup(function () {
      expect(processInfo.user).to.equal(userDetails.name)
      expect(processInfo.uid).to.equal(userDetails.uid)
      expect(processInfo.group).to.equal(groupDetails.name)
      expect(processInfo.gid).to.equal(groupDetails.gid)

      done()
    })
  })

  it('should take user and group via posix from process if parameters not passed', function (done) {
    var user = 'foo'
    var group = 'bar'

    var userDetails = {
      name: user,
      uid: 5
    }

    var groupDetails = {
      name: group,
      gid: 6
    }

    processInfo.user = undefined
    processInfo.group = undefined

    processInfo._posix.getpwnam.withArgs(process.getuid()).returns(userDetails)
    processInfo._posix.getgrnam.withArgs(process.getgid()).returns(groupDetails)

    processInfo._checkUserAndGroup(function () {
      expect(processInfo.user).to.equal(userDetails.name)
      expect(processInfo.uid).to.equal(userDetails.uid)
      expect(processInfo.group).to.equal(groupDetails.name)
      expect(processInfo.gid).to.equal(groupDetails.gid)

      done()
    })
  })

  it('should propagate error if getting user and group via posix fails', function (done) {
    var error = new Error('Urk!')

    processInfo._posix.getpwnam.throws(error)

    processInfo._checkUserAndGroup(function (er) {
      expect(er).to.equal(error)
      expect(er.code).to.equal('INVALID')

      done()
    })
  })

  it('should update a logger', function (done) {
    processInfo.logger.add = function(logger) {
      logger.emit('open')
    }

    processInfo._fileSystem.getLogDir.returns(os.tmpdir())
    processInfo._fs.chown.callsArgAsync(3)

    processInfo._updateLogger(done)
  })

  it('should check that the script exists', function (done) {
    processInfo.script = '/foo/bar.js'
    processInfo._fs.exists.withArgs(processInfo.script).callsArgWith(1, true)

    processInfo._checkScriptExists(function (error) {
      expect(error).to.not.exist

      done()
    })
  })

  it('should pass back error if script does not exist', function (done) {
    processInfo.script = '/foo/bar.js'
    processInfo._fs.exists.withArgs(processInfo.script).callsArgWith(1, false)

    processInfo._checkScriptExists(function (error) {
      expect(error.code).to.equal('INVALID')

      done()
    })
  })

  it('should take cwd from script dirname if is not a directory', function (done) {
    processInfo.script = '/foo/bar.js'
    processInfo._fs.stat.withArgs(processInfo.script).callsArgWith(1, undefined, {
      isDirectory: sinon.stub().returns(false)
    })

    processInfo._takeCwdFromScript(function () {
      expect(processInfo.cwd).to.equal('/foo')

      done()
    })
  })

  it('should set cwd as script if is a directory', function (done) {
    processInfo.script = '/foo'
    processInfo._fs.stat.withArgs(processInfo.script).callsArgWith(1, undefined, {
      isDirectory: sinon.stub().returns(true)
    })

    processInfo._takeCwdFromScript(function () {
      expect(processInfo.cwd).to.equal('/foo')

      done()
    })
  })

  it('should propagate error if one occurs during cwd stat', function (done) {
    var error = new Error('Urk!')

    processInfo.script = '/foo'
    processInfo._fs.stat.withArgs(processInfo.script).callsArgWith(1, error)

    processInfo._takeCwdFromScript(function (er) {
      expect(er).to.equal(error)

      done()
    })
  })

  it('should not overwrite cwd if already set', function (done) {
    processInfo.cwd = '/bar'

    processInfo._takeCwdFromScript(function () {
      expect(processInfo.cwd).to.equal('/bar')

      done()
    })
  })

  it('should check that cwd exists', function (done) {
    processInfo.cwd = '/bar'
    processInfo._fs.exists.withArgs(processInfo.cwd).callsArgWith(1, true)

    processInfo._checkCwdExists(done)
  })

  it('should pass back error if cwd does not exist', function (done) {
    processInfo.cwd = '/bar'
    processInfo._fs.exists.withArgs(processInfo.cwd).callsArgWith(1, false)

    processInfo._checkCwdExists(function (error) {
      expect(error.code).to.equal('INVALID')

      done()
    })
  })
})
