var expect = require('chai').expect,
  sinon = require('sinon'),
  FileSystem = require('../../../../lib/daemon/util/FileSystem'),
  os = require('os'),
  fs = require('fs'),
  posix = require('posix'),
  mkdirp = require('mkdirp'),
  shortId = require('shortid')

describe('FileSystem', function() {
  var temp, fileSystem

  beforeEach(function() {
    temp = os.tmpdir() + '/' + shortId.generate()
    fileSystem = new FileSystem()
    fileSystem._config = {
      guvnor: {
        logdir: temp + '/log',
        confdir: temp + '/conf',
        rundir: temp + '/run',
        appdir: temp + '/apps',
        user: posix.getpwnam(process.getuid()).name,
        group: posix.getgrnam(process.getgid()).name
      }
    }
    fileSystem._logger = {
      info: function() {},
      warn: function() {},
      error: function() {},
      debug: function() {}
    }
    fileSystem._posix = posix
    fileSystem._fs = fs
    fileSystem._mkdirp = mkdirp
  })

  it('should create directories', function() {
    expect(fs.existsSync(fileSystem._config.guvnor.rundir)).to.be.false

    fileSystem.afterPropertiesSet()

    expect(fs.existsSync(fileSystem._config.guvnor.rundir)).to.be.true
    expect(fs.existsSync(fileSystem._config.guvnor.rundir + '/processes')).to.be.true
    expect(fs.existsSync(fileSystem._config.guvnor.logdir)).to.be.true
    expect(fs.existsSync(fileSystem._config.guvnor.confdir)).to.be.true
    expect(fs.existsSync(fileSystem._config.guvnor.appdir)).to.be.true
  })

  it('should not create a directory when one exists', function() {
    fileSystem._fs = {
      existsSync: sinon.stub()
    }
    fileSystem._mkdirp = {
      sync: sinon.stub()
    }

    fileSystem._fs.existsSync.returns(true)

    fileSystem.afterPropertiesSet()

    expect(fileSystem._mkdirp.sync.callCount).to.equal(0)
  })

  it('should throw an error when directory creation fails', function() {
    fileSystem._fs = {
      existsSync: sinon.stub(),
      chownSync: sinon.stub()
    }
    fileSystem._mkdirp = {
      sync: sinon.stub()
    }

    fileSystem._fs.existsSync.returns(false)
    fileSystem._mkdirp.sync.throws(new Error('urk!'))

    try {
      fileSystem.afterPropertiesSet()
    } catch(e) {
      if(e.message != 'urk!') throw e
    }

    expect(fileSystem._fs.chownSync.callCount).to.equal(0)
  })
})
