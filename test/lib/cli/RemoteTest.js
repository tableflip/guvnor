var expect = require('chai').expect,
  sinon = require('sinon'),
  Remote = require('../../../lib/cli/Remote')

describe('Remote', function() {
  var remote, guvnor, info

  beforeEach(function() {
    info = console.info
    console.info = sinon.stub()

    remote = new Remote()
    remote._config = {
      guvnor: {

      }
    }
    remote._logger = {
      info: sinon.stub(),
      warn: sinon.stub(),
      error: sinon.stub(),
      debug: sinon.stub()
    }
    remote._connectOrStart = sinon.stub()
    remote._os = {
      hostname: sinon.stub()
    }

    guvnor = {
      disconnect: sinon.stub(),
      on: sinon.stub()
    }

    remote._connectOrStart.callsArgWith(0, undefined, guvnor)
  })

  afterEach(function() {
    console.info = info
  })

  it('should print hostconfig', function() {
    var hostname = 'hostname'
    var port = 'port'
    var user = 'user'
    var secret = 'secret'

    guvnor.remoteHostConfig = sinon.stub()
    guvnor.remoteHostConfig.callsArgWith(0, undefined, hostname, port, user, secret)

    remote.remoteHostConfig()

    expect(guvnor.disconnect.called).to.be.true
    expect(console.info.calledWith(sinon.match.string, hostname)).to.be.true
    expect(console.info.calledWith(sinon.match.string, port)).to.be.true
    expect(console.info.calledWith(sinon.match.string, user)).to.be.true
    expect(console.info.calledWith(sinon.match.string, secret)).to.be.true
  })

  it('should add a remote user', function() {
    var userName = 'userName'
    var hostName = 'hostName.foo.bar.com'
    var user = {
      secret: 'shh'
    }
    remote._os.hostname.returns(hostName)

    guvnor.addRemoteUser = sinon.stub()
    guvnor.addRemoteUser.withArgs(userName, sinon.match.func).callsArgWith(1, undefined, user)

    remote.addRemoteUser(userName)

    expect(guvnor.disconnect.called).to.be.true
    expect(console.info.calledWith(sinon.match.string, userName, 'hostName-foo-bar-com')).to.be.true
    expect(console.info.calledWith(sinon.match.string, user.secret)).to.be.true
  })

  it('should delete a remote user', function() {
    var userName = 'userName'

    guvnor.removeRemoteUser = sinon.stub()
    guvnor.removeRemoteUser.withArgs(userName, sinon.match.func).callsArgWith(1, undefined)

    remote.deleteRemoteUser(userName)

    expect(guvnor.disconnect.called).to.be.true
  })

  it('should list remote users', function() {
    var users = [{
      name: 'foo'
    }, {
      name: 'bar'
    }, {
      name: 'baz'
    }]

    guvnor.listRemoteUsers = sinon.stub()
    guvnor.listRemoteUsers.withArgs(sinon.match.func).callsArgWith(0, undefined, users)

    remote.listRemoteUsers()

    expect(guvnor.disconnect.called).to.be.true
    expect(console.info.calledWith(users[0].name)).to.be.true
    expect(console.info.calledWith(users[1].name)).to.be.true
    expect(console.info.calledWith(users[2].name)).to.be.true
  })

  it('should print a message when there are no remote users', function() {
    var users = []

    guvnor.listRemoteUsers = sinon.stub()
    guvnor.listRemoteUsers.withArgs(sinon.match.func).callsArgWith(0, undefined, users)

    remote.listRemoteUsers()

    expect(guvnor.disconnect.called).to.be.true
    expect(console.info.getCall(0).args[0]).to.contain('No remote users')
  })

  it('should rotate remote user keys', function() {
    var userName = 'userName'
    var hostName = 'hostName.foo.bar.com'
    var user = {
      secret: 'shh'
    }
    remote._os.hostname.returns(hostName)

    guvnor.rotateRemoteUserKeys = sinon.stub()
    guvnor.rotateRemoteUserKeys.withArgs(userName, sinon.match.func).callsArgWith(1, undefined, user)

    remote.rotateRemoteUserKeys(userName)

    expect(guvnor.disconnect.called).to.be.true
    expect(console.info.calledWith(sinon.match.string, userName, 'hostName-foo-bar-com')).to.be.true
    expect(console.info.calledWith(sinon.match.string, user.secret)).to.be.true
  })

  it('should generate an ssl certificate', function() {
    var location = '/foo/bar'

    guvnor.generateRemoteRpcCertificates = sinon.stub()
    guvnor.generateRemoteRpcCertificates.withArgs(365, sinon.match.func).callsArgWith(1, undefined, location)

    remote.generateSSLCertificate()

    expect(guvnor.disconnect.called).to.be.true
    expect(console.info.calledWith(sinon.match.string, location)).to.be.true
  })
})
