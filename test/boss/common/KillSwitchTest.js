var should = require('should'),
  sinon = require('sinon'),
  path = require('path'),
  KillSwitch = require('../../../lib/boss/common/KillSwitch')

describe('KillSwitch', function() {

  var killSwitch, server

  beforeEach(function() {
    killSwitch = new KillSwitch()
    killSwitch._userInfo = {
      getUid: sinon.stub(),
      getGid: sinon.stub()
    }
    killSwitch._fileSystem = {
      findOrCreateProcessDirectory: sinon.stub()
    }
    killSwitch._parentProcess = {
      send: sinon.stub()
    }
    killSwitch._dnode = sinon.stub()

    server = {
      listen: sinon.stub()
    }

    killSwitch._dnode.returns(server)
  })

  it('should start a kill switch', function() {
    var processDirectory = 'foo bar baz';

    killSwitch._fileSystem.findOrCreateProcessDirectory.callsArgWith(0, null, processDirectory)

    killSwitch.afterPropertiesSet()

    // should have started a server
    server.listen.callCount.should.equal(1)
    server.listen.getCall(0).args[0].should.equal(processDirectory + '/' + process.pid)
  })

  it('should provide a method to kill the process', function() {
    var processDirectory = 'foo bar baz';

    killSwitch._fileSystem.findOrCreateProcessDirectory.callsArgWith(0, null, 'foo')

    killSwitch.afterPropertiesSet()

    killSwitch._dnode.callCount.should.equal(1)
    should(killSwitch._dnode.getCall(0).args[0].kill).be.ok
  })
})
