var expect = require('chai').expect,
  sinon = require('sinon'),
  AppInfo = require('../../../../lib/daemon/domain/AppInfo')

describe('AppInfo', function() {
  var appInfo

  beforeEach(function() {
    appInfo = new AppInfo({
      url: 'foo',
      user: 'bar'
    })
    appInfo._config = {}
    appInfo._posix = {
      getpwnam: sinon.stub(),
      getgrnam: sinon.stub()
    }
    appInfo._rimraf = sinon.stub()
    appInfo._commandLine = {
      git: sinon.stub(),
      npm: sinon.stub()
    }
    appInfo._config = {
      boss: {

      }
    }

    appInfo._posix.getpwnam.returns({gid: 4})
    appInfo._posix.getgrnam.returns({gid: 5})

    appInfo.afterPropertiesSet()
  })

  it('should clone a repo', function(done) {
    appInfo._config.boss.appdir = 'directory'
    appInfo._commandLine.git.callsArg(6)
    appInfo.name = 'foo'

    var onOut = sinon.stub()
    var onErr = sinon.stub()

    appInfo.clone(onOut, onErr, function(error) {
      expect(error).to.not.exist

      done()
    })
  })

  it('should check out a ref', function(done) {
    appInfo._config.boss.appdir = 'directory'
    appInfo._commandLine.git.callsArg(6)
    appInfo._commandLine.npm.callsArg(6)
    var ref = 'foo'

    var onOut = sinon.stub()
    var onErr = sinon.stub()

    appInfo.checkout(ref, onOut, onErr, function(error) {
      expect(error).to.not.exist

      done()
    })
  })

  it('should remove a repo', function(done) {
    appInfo._config.boss.appdir = 'directory'
    appInfo._rimraf.callsArg(1)

    appInfo.remove(function(error) {
      expect(error).to.not.exist

      done()
    })
  })

  it('should fail to remove a repo', function(done) {
    appInfo._config.boss.appdir = 'directory'
    appInfo._rimraf.callsArgWith(1, new Error('urk!'))

    appInfo.remove(function(error) {
      expect(error.message).to.equal('urk!')

      done()
    })
  })

  it('should require options', function() {
    try {
      new AppInfo()
    } catch(error) {
      if(error.message.indexOf('options') == -1) throw error
    }
  })

  it('should require a url', function() {
    try {
      new AppInfo({})
    } catch(error) {
      if(error.message.indexOf('url') == -1) throw error
    }
  })

  it('should require a user', function() {
    try {
      new AppInfo({
        url: 'foo'
      })
    } catch(error) {
      if(error.message.indexOf('user') == -1) throw error
    }
  })
})
