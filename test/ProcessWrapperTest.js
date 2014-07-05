var should = require('should'),
  sinon = require('sinon'),
  path = require('path'),
  ProcessWrapper = require('../lib/boss/process/ProcessWrapper')

describe('ProcessWrapper', function() {
  var processWrapper

  beforeEach(function() {
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
  })

  it('should set the process title', function() {
    var processTitle = 'blah'

    process.env.BOSS_PROCESS_NAME = processTitle

    processWrapper._setProcessName(sinon.stub())

    process.title.should.equal(processTitle)
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

    process.setuid.callCount.should.equal(1)
    process.setuid.calledWith(uid).should.be.true

    process.setgid.callCount.should.equal(1)
    process.setgid.calledWith(gid).should.be.true

    process.initgroups.callCount.should.equal(1)
    process.initgroups.calledWith(uid, gid).should.be.true

    process.setgroups.callCount.should.equal(1)
    process.setgroups.calledWith([]).should.be.true

    done()
  })

  it('should remove boss properties from the environment', function(done) {
    process.env.BOSS_TEST_PROPERTY = 'foo'

    processWrapper._removeBossPropertiesFromEnvironment(sinon.stub())

    should(process.env.BOSS_TEST_PROPERTY).be.undefined

    done()
  })
})
