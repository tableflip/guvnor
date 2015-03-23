var expect = require('chai').expect,
  sinon = require('sinon'),
  AppInfo = require('../../../../lib/daemon/domain/AppInfo')

describe('AppInfo', function () {
  var appInfo

  beforeEach(function () {
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
    appInfo._fs = {
      exists: sinon.stub()
    }
  })

  it('should create a user details object', function (done) {
    var userDetails = {
      name: 'foo'

    }
    var appDir = 'bar'

    appInfo._fs.exists.callsArgWith(1, false)
    appInfo._fileSystem.getAppDir.returns(appDir)
    appInfo._userDetailsFactory.create.withArgs([appInfo.user]).callsArgWith(1, undefined, userDetails)

    appInfo.afterPropertiesSet(function (error) {
      expect(error).not.to.exist
      expect(appInfo._user).to.equal(userDetails)
      expect(appInfo.path).to.equal(appDir + '/' + appInfo.id)

      done()
    })
  })

  it('should propagate error creating a user details object', function (done) {
    var error = new Error('Urk!')
    appInfo._userDetailsFactory.create.withArgs([appInfo.user]).callsArgWith(1, error)

    appInfo.afterPropertiesSet(function (er) {
      expect(er).to.equal(error)

      done()
    })
  })

  it('should clone a repo', function (done) {
    appInfo.name = 'foo'
    appInfo.path = 'bar'
    appInfo._commandLine.git.callsArg(6)

    appInfo.clone(sinon.stub(), sinon.stub(), function (error) {
      expect(error).to.not.exist

      done()
    })
  })

  it('should check out a ref', function (done) {
    appInfo._commandLine.git.callsArg(6)
    appInfo._commandLine.npm.callsArg(6)

    appInfo.checkout('foo', sinon.stub(), sinon.stub(), function (error) {
      expect(error).to.not.exist

      done()
    })
  })

  it('should remove a repo', function (done) {
    appInfo._rimraf.callsArg(1)

    appInfo.remove(function (error) {
      expect(error).to.not.exist

      done()
    })
  })

  it('should fail to remove a repo', function (done) {
    appInfo._rimraf.callsArgWith(1, new Error('urk!'))

    appInfo.remove(function (error) {
      expect(error.message).to.equal('urk!')

      done()
    })
  })

  it('should require options', function () {
    try {
      new AppInfo()
    } catch (error) {
      if (error.message.indexOf('options') == -1)
        throw error
    }
  })

  it('should require a url', function () {
    try {
      new AppInfo({})
    } catch (error) {
      if (error.message.indexOf('url') == -1)
        throw error
    }
  })

  it('should require a user', function () {
    try {
      new AppInfo({
        url: 'foo'
      })
    } catch (error) {
      if (error.message.indexOf('user') == -1)
        throw error
    }
  })

  it('should list refs', function (done) {
    appInfo.listRefs(function (error, refs) {
      expect(error).not.to.exist
      expect(refs[1].name).to.equal('refs/tags/foo')
      expect(refs[2].name).to.equal('refs/tags/bar')

      done()
    })

    expect(appInfo._commandLine.git.callCount).to.equal(1)
    expect(appInfo._commandLine.git.calledWith(['show-ref'])).to.be.true

    appInfo._commandLine.git.getCall(0).args[3]('c044400c5d42ec977721f267e304e4a3ca5d704e refs/tags/v3.2.0\n')
    appInfo._commandLine.git.getCall(0).args[3]('c044400c5d42ec977721f267e304e4a3ca5d704e refs/tags/foo\n')
    appInfo._commandLine.git.getCall(0).args[3]('c044400c5d42ec977721f267e304e4a3ca5d704e refs/tags/bar\n')
    appInfo._commandLine.git.getCall(0).args[3]('c044400c5d42ec977721f267e304e4a3ca5d704e refs/tags/v3.2.0\n')

    appInfo._commandLine.git.getCall(0).args[6]()
  })

  it('should report the current ref', function (done) {
    var currentRef = 'foo'

    appInfo.currentRef(function (error, ref) {
      expect(error).not.to.exist
      expect(ref).to.equal(currentRef)

      done()
    })

    expect(appInfo._commandLine.git.callCount).to.equal(1)
    expect(appInfo._commandLine.git.calledWith(['rev-parse', 'HEAD'])).to.be.true

    appInfo.listRefs = sinon.stub().callsArgWith(0, undefined, [{
      name: 'foo',
      commit: currentRef
    }])

    appInfo._commandLine.git.getCall(0).args[3](currentRef + '\n')
    appInfo._commandLine.git.getCall(0).args[6]()
  })

  it('should update refs', function (done) {
    appInfo._commandLine.git.withArgs(['reset', '--hard', 'HEAD']).callsArg(6)
    appInfo._commandLine.git.withArgs(['clean', '-d', '-f']).callsArg(6)
    appInfo._commandLine.git.withArgs(['fetch']).callsArg(6)
    appInfo.listRefs = sinon.stub()
    appInfo.listRefs.callsArgWith(0, undefined, 'refs')

    appInfo.updateRefs(sinon.stub(), sinon.stub(), function (error, updatedApp, refs) {
      expect(error).not.to.exist
      expect(updatedApp).to.equal(appInfo)
      expect(refs).to.equal('refs')

      done()
    })
  })

  it('should not install dependencies when no package.json exists', function (done) {
    appInfo.path = 'foo'

    appInfo._fs.exists.withArgs(appInfo.path + '/package.json').callsArgWith(1, false)

    appInfo.installDependencies(null, null, done)
  })

  it('should install dependencies', function (done) {
    appInfo.path = 'foo'

    appInfo._fs.exists.withArgs(appInfo.path + '/package.json').callsArgWith(1, true)

    appInfo._rimraf.withArgs(appInfo.path + '/node_modules').callsArg(1)
    appInfo._commandLine.npm.callsArg(6)

    appInfo.installDependencies(sinon.stub(), sinon.stub(), done)
  })
})
