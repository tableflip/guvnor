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
    appInfo._rimraf = sinon.stub()
    appInfo._commandLine = {
      git: sinon.stub(),
      npm: sinon.stub()
    }
    appInfo._fileSystem = {
      getAppDir: sinon.stub()
    }
    appInfo._userDetailsFactory = {
      create: sinon.stub()
    }

    appInfo.afterPropertiesSet()
  })

  it('should clone a repo', function(done) {
    appInfo.name = 'foo'
    appInfo.path = 'bar'
    appInfo._commandLine.git.callsArg(6)

    appInfo.clone(sinon.stub(), sinon.stub(), function(error) {
      expect(error).to.not.exist

      done()
    })
  })

  it('should check out a ref', function(done) {
    appInfo._commandLine.git.callsArg(6)
    appInfo._commandLine.npm.callsArg(6)

    appInfo.checkout('foo', sinon.stub(), sinon.stub(), function(error) {
      expect(error).to.not.exist

      done()
    })
  })

  it('should remove a repo', function(done) {
    appInfo._rimraf.callsArg(1)

    appInfo.remove(function(error) {
      expect(error).to.not.exist

      done()
    })
  })

  it('should fail to remove a repo', function(done) {
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
