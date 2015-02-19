var expect = require('chai').expect,
  sinon = require('sinon'),
  path = require('path'),
  ProcessWrapper = require('../../../../lib/daemon/process/ProcessWrapper')

describe('ProcessWrapper', function() {
  var processWrapper, name

  beforeEach(function() {
    name = process.title

    processWrapper = new ProcessWrapper()
    processWrapper._logger = {
      info: sinon.stub(),
      warn: sinon.stub(),
      error: sinon.stub(),
      debug: sinon.stub()
    }
    processWrapper._parentProcess = {
      send: sinon.stub()
    }
    processWrapper._userInfo = {
      getGroupName: sinon.stub(),
      getGid: sinon.stub(),
      getUserName: sinon.stub(),
      getUid: sinon.stub()
    }
    processWrapper._processRpc = {
      startDnodeServer: sinon.stub()
    }
  })

  afterEach(function() {
    process.title = name
  })

  it('should set the process title', function() {
    var processTitle = 'blah'

    process.env.GUVNOR_PROCESS_NAME = processTitle

    processWrapper._setProcessName(sinon.stub())

    expect(process.title).to.equal(processTitle)
  })

  it('should switch process uid and gid', function(done) {
    var uid = 482
    var gid = 503

    process.setgid = sinon.stub()
    process.setuid = sinon.stub()
    process.setgroups = sinon.stub()
    process.initgroups = sinon.stub()

    processWrapper._userInfo.getUid.returns(uid)
    processWrapper._userInfo.getGid.returns(gid)

    processWrapper._switchToUserAndGroup(sinon.stub())

    expect(process.setuid.callCount).to.equal(1)
    expect(process.setuid.calledWith(uid)).to.be.true

    expect(process.setgid.callCount).to.equal(1)
    expect(process.setgid.calledWith(gid)).to.be.true

    expect(process.initgroups.callCount).to.equal(1)
    expect(process.initgroups.calledWith(uid, gid)).to.be.true

    expect(process.setgroups.callCount).to.equal(1)
    expect(process.setgroups.calledWith([])).to.be.true

    done()
  })

  it('should remove guvnor properties from the environment', function(done) {
    process.env.GUVNOR_TEST_PROPERTY = 'foo'

    processWrapper._removePropertiesFromEnvironment(sinon.stub())

    expect(process.env.GUVNOR_TEST_PROPERTY).to.be.undefined

    done()
  })

  it('should start a process', function(done) {
    processWrapper._startProcess('mocha', function(error) {
      expect(error).to.not.exist

      done()
    })
  })

  it('should inform parent process that we failed to start', function() {
    processWrapper._setProcessName = function(callback) {
      callback(new Error('urk!'))
    }

    processWrapper.afterPropertiesSet()

    expect(processWrapper._parentProcess.send.calledWith('process:failed', sinon.match.object)).to.be.true
  })

  it('should throw if the users process errors', function() {
    process.env.GUVNOR_PROCESS_NAME = 'ProcessWrapperTest-process-error'

    processWrapper._startProcess = function(script, callback) {
      callback(new Error('urk!'))
    }

    processWrapper._processRpc.startDnodeServer.callsArg(0)

    processWrapper.afterPropertiesSet()

    expect(processWrapper._parentProcess.send.calledWith('process:errored', sinon.match.object)).to.be.true
  })
})
