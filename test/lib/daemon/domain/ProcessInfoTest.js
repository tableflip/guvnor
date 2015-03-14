var expect = require('chai').expect,
  sinon = require('sinon'),
  ProcessInfo = require('../../../../lib/daemon/domain/ProcessInfo'),
  posix = require('posix'),
  semver = require('semver')

describe('ProcessInfo', function () {
  var fileSystemStub = {findOrCreateLogFileDirectory: sinon.stub()}

  it('should serialize and deserialize', function () {
    var processInfo = new ProcessInfo({
      script: '/foo/bar/baz.js',
      cwd: '/foo/bar'
    })
    processInfo._posix = {
      getpwnam: sinon.stub(),
      getgrnam: sinon.stub()
    }
    processInfo._fs = {
      statSync: sinon.stub()
    }
    processInfo._config = {
      guvnor: {
        logdir: 'foo'
      }
    }
    processInfo._fileSystem = {
      getLogDir: sinon.stub()
    }
    processInfo._posix.getpwnam.returns({name: 'foo'})
    processInfo._posix.getgrnam.returns({name: 'bar'})

    var otherProcessInfo = new ProcessInfo(JSON.parse(JSON.stringify(processInfo)))
    otherProcessInfo._posix = {
      getpwnam: sinon.stub(),
      getgrnam: sinon.stub()
    }
    otherProcessInfo._fs = {
      statSync: sinon.stub()
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
    var processInfo = new ProcessInfo({
      script: '/foo/bar/baz.js'
    })
    processInfo._posix = {
      getpwnam: sinon.stub(),
      getgrnam: sinon.stub()
    }
    processInfo._fs = {
      statSync: sinon.stub()
    }
    processInfo._config = {
      guvnor: {
        logdir: 'foo'
      }
    }
    processInfo._fileSystem = {
      getLogDir: sinon.stub()
    }
    processInfo._posix.getpwnam.returns({name: 'foo'})
    processInfo._posix.getgrnam.returns({name: 'bar'})
    processInfo._fs.statSync.withArgs('/foo/bar/baz.js').returns({
      isDirectory: function () {
        return false
      }
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
    var processInfo = new ProcessInfo({
      script: 'test.js',
      debug: true,
      execArgv: ['--debug=5', '--debug-brk=5']
    })
    processInfo._logger = {
      info: sinon.stub(),
      warn: sinon.stub(),
      error: sinon.stub(),
      debug: sinon.stub(),
      log: sinon.stub()
    }
    processInfo._fileSystem = fileSystemStub
    processInfo._config = {
      guvnor: {
        logdir: 'foo'
      },
      debug: {
        cluster: false
      }
    }
    processInfo._posix = {
      getpwnam: sinon.stub(),
      getgrnam: sinon.stub()
    }
    processInfo._fs = {
      statSync: sinon.stub()
    }
    processInfo._fileSystem = {
      getLogDir: sinon.stub()
    }
    processInfo._posix.getpwnam.returns({name: 'foo'})
    processInfo._posix.getgrnam.returns({name: 'bar'})
    processInfo._fs.statSync.withArgs('test.js').returns({
      isDirectory: function () {
        return false
      }
    })

    processInfo.debugPort = 6

    expect(processInfo.getProcessOptions().execArgv.indexOf('--debug=5')).to.equal(-1)
    expect(processInfo.getProcessOptions().execArgv.indexOf('--debug-brk=5')).to.equal(-1)
  })

  it('should update the debug port for processes', function () {
    var processInfo = new ProcessInfo({
      script: 'test.js',
      debug: true
    })
    processInfo._logger = {
      info: sinon.stub(),
      warn: sinon.stub(),
      error: sinon.stub(),
      debug: sinon.stub(),
      log: sinon.stub()
    }
    processInfo._fileSystem = fileSystemStub
    processInfo._config = {
      guvnor: {
        logdir: 'foo'
      },
      debug: {
        cluster: false
      }
    }
    processInfo._posix = {
      getpwnam: sinon.stub(),
      getgrnam: sinon.stub()
    }
    processInfo._fs = {
      statSync: sinon.stub()
    }
    processInfo._fileSystem = {
      getLogDir: sinon.stub()
    }
    processInfo._posix.getpwnam.returns({name: 'foo'})
    processInfo._posix.getgrnam.returns({name: 'bar'})
    processInfo._fs.statSync.withArgs('test.js').returns({
      isDirectory: function () {
        return false
      }
    })
    processInfo.debugPort = 5

    expect(processInfo.getProcessOptions().execArgv.indexOf('--debug-brk=5')).to.equal(0)
  })

  it('should not debug-brk cluster manager when config says not to', function () {
    var processInfo = new ProcessInfo({
      script: 'test.js',
      debug: true,
      instances: 5
    })
    processInfo._logger = {
      info: sinon.stub(),
      warn: sinon.stub(),
      error: sinon.stub(),
      debug: sinon.stub(),
      log: sinon.stub()
    }
    processInfo._fileSystem = fileSystemStub
    processInfo._config = {
      guvnor: {
        logdir: 'foo'
      },
      debug: {
        cluster: false
      }
    }
    processInfo._posix = {
      getpwnam: sinon.stub(),
      getgrnam: sinon.stub()
    }
    processInfo._fs = {
      statSync: sinon.stub()
    }
    processInfo._fileSystem = {
      getLogDir: sinon.stub()
    }
    processInfo._posix.getpwnam.returns({name: 'foo'})
    processInfo._posix.getgrnam.returns({name: 'bar'})
    processInfo._fs.statSync.withArgs('test.js').returns({
      isDirectory: function () {
        return false
      }
    })
    processInfo.debugPort = 5

    var portArg = '--debug=5'

    if (semver.gt(process.version, '0.11.0')) {
      portArg = '--debug-port=5'
    }

    expect(processInfo.getProcessOptions().execArgv).to.contain(portArg)
    expect(processInfo.getProcessOptions().execArgv).to.not.contain('--debug-brk=5')
  })

  it('should debug-brk cluster manager when config says to', function () {
    var processInfo = new ProcessInfo({
      script: 'test.js',
      debug: true,
      instances: 5
    })
    processInfo._logger = {
      info: sinon.stub(),
      warn: sinon.stub(),
      error: sinon.stub(),
      debug: sinon.stub(),
      log: sinon.stub()
    }
    processInfo._fileSystem = fileSystemStub
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
      statSync: sinon.stub()
    }
    processInfo._fileSystem = {
      getLogDir: sinon.stub()
    }
    processInfo._posix.getpwnam.returns({name: 'foo'})
    processInfo._posix.getgrnam.returns({name: 'bar'})
    processInfo._fs.statSync.withArgs('test.js').returns({
      isDirectory: function () {
        return false
      }
    })
    processInfo.debugPort = 5

    var portArg = '--debug=5'

    if (semver.gt(process.version, '0.11.0')) {
      portArg = '--debug-port=5'
    }

    expect(processInfo.getProcessOptions().execArgv).to.not.contain(portArg)
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
      statSync: sinon.stub()
    }
    processInfo._fileSystem = {
      getLogDir: sinon.stub()
    }
    processInfo._posix.getpwnam.withArgs('foo').returns({name: 'foo'})
    processInfo._posix.getgrnam.returns({name: 'bar'})
    processInfo._fs.statSync.withArgs('test.js').returns({
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
    var processInfo = new ProcessInfo({
      script: 'test.js'
    })
    processInfo.setOptions({
      env: {
        FOO: 'bar'
      }
    })

    expect(processInfo.getProcessOptions().env.FOO).to.equal('bar')
  })
})
