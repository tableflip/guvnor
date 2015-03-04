var expect = require('chai').expect,
  sinon = require('sinon'),
  LocalDaemonStarter = require('../../../lib/local/LocalDaemonStarter')

describe('LocalDaemonStarter', function () {
  var localDaemonStarter

  beforeEach(function () {
    localDaemonStarter = new LocalDaemonStarter()
    localDaemonStarter._logger = {
      info: sinon.stub(),
      warn: sinon.stub(),
      error: sinon.stub(),
      debug: sinon.stub()
    }
    localDaemonStarter._config = {
      guvnor: {

      },
      debug: {

      }
    }
    localDaemonStarter._freeport = sinon.stub()
    localDaemonStarter._posix = {
      getpwnam: sinon.stub(),
      getgrnam: sinon.stub()
    }
    localDaemonStarter._child_process = {}
  })

  it('should start the daemon', function (done) {
    localDaemonStarter._config.guvnor.user = 'user'
    localDaemonStarter._config.guvnor.group = 'group'

    var userId = 5
    var groupId = 10

    localDaemonStarter._posix.getpwnam.withArgs(localDaemonStarter._config.guvnor.user).returns({
      uid: userId
    })
    localDaemonStarter._posix.getgrnam.withArgs(localDaemonStarter._config.guvnor.group).returns({
      gid: groupId
    })

    var daemon = {
      on: sinon.stub(),
      unref: sinon.stub(),
      send: sinon.stub(),
      disconnect: sinon.stub()
    }

    localDaemonStarter._child_process.spawn = sinon.stub()
    localDaemonStarter._child_process.spawn.returns(daemon)

    localDaemonStarter.start(function (error, sockets) {
      expect(error).to.not.exist
      expect(sockets).to.equal('started')

      done()
    })

    // should have passed the right arguments to spawn
    expect(localDaemonStarter._child_process.spawn.callCount).to.equal(1)
    expect(localDaemonStarter._child_process.spawn.getCall(0).args[2].detached).to.be.true
    expect(localDaemonStarter._child_process.spawn.getCall(0).args[2].uid).to.equal(userId)
    expect(localDaemonStarter._child_process.spawn.getCall(0).args[2].gid).to.equal(groupId)

    // should have made sure that the daemon won't keep this process hanging around
    expect(daemon.unref.calledOnce).to.be.true

    expect(daemon.on.getCall(4).args[0]).to.equal('message')
    var onMessage = daemon.on.getCall(4).args[1]

    // simulate daemon starting up
    onMessage({
      event: 'daemon:config:request'
    })

    // should have sent configuration to daemon
    expect(daemon.send.getCall(0).args[0].event).to.equal('daemon:config:response')
    expect(daemon.send.getCall(0).args[0].args[0]).to.equal(localDaemonStarter._config)

    onMessage({
      event: 'daemon:ready',
      args: ['started']
    })

    // should have disconnected from daemon process
    expect(daemon.disconnect.callCount).to.equal(1)
  })

  it('should kill the daemon if it fails to start up', function (done) {
    var daemon = {
      on: sinon.stub(),
      unref: sinon.stub(),
      send: sinon.stub(),
      kill: sinon.stub(),
      removeAllListeners: sinon.stub()
    }

    localDaemonStarter._child_process.spawn = sinon.stub()
    localDaemonStarter._child_process.spawn.returns(daemon)

    localDaemonStarter._config.guvnor.user = 'user'
    localDaemonStarter._posix.getpwnam.withArgs(localDaemonStarter._config.guvnor.user).returns({
      uid: 5
    })
    localDaemonStarter._config.guvnor.group = 'group'
    localDaemonStarter._posix.getgrnam.withArgs(localDaemonStarter._config.guvnor.group).returns({
      gid: 5
    })

    localDaemonStarter.start(function (error) {
      expect(error.code).to.equal('bar')

      done()
    })

    expect(daemon.on.getCall(4).args[0]).to.equal('message')
    var onMessage = daemon.on.getCall(4).args[1]

    // simulate daemon starting up
    onMessage({
      event: 'daemon:fatality',
      args: [{
        message: 'foo',
        code: 'bar'
      }]
    })

    // should have killed the daemon process
    expect(daemon.kill.callCount).to.equal(1)
  })

  it('should warn the user when a permissions error is encountered while starting the daemon', function (done) {
    var daemon = {
      on: sinon.stub(),
      unref: sinon.stub(),
      send: sinon.stub(),
      kill: sinon.stub(),
      removeAllListeners: sinon.stub()
    }

    localDaemonStarter._child_process.spawn = sinon.stub()
    localDaemonStarter._child_process.spawn.returns(daemon)

    localDaemonStarter._config.guvnor.user = 'user'
    localDaemonStarter._posix.getpwnam.withArgs(localDaemonStarter._config.guvnor.user).returns({
      uid: 5
    })
    localDaemonStarter._config.guvnor.group = 'group'
    localDaemonStarter._posix.getgrnam.withArgs(localDaemonStarter._config.guvnor.group).returns({
      gid: 5
    })

    localDaemonStarter.start(function (error) {
      expect(error.message).to.contain('permissions')

      done()
    })

    expect(daemon.on.getCall(4).args[0]).to.equal('message')
    var onMessage = daemon.on.getCall(4).args[1]

    // simulate daemon starting up
    onMessage({
      event: 'daemon:fatality',
      args: [{
        message: 'foo',
        code: 'EACCES'
      }]
    })
  })

  it('should start the daemon with a specified debug port', function () {
    localDaemonStarter._config.debug.daemon = 10

    var daemon = {
      on: sinon.stub(),
      unref: sinon.stub(),
      send: sinon.stub(),
      disconnect: sinon.stub()
    }

    localDaemonStarter._child_process.spawn = sinon.stub()
    localDaemonStarter._child_process.spawn.returns(daemon)

    localDaemonStarter._config.guvnor.user = 'user'
    localDaemonStarter._posix.getpwnam.withArgs(localDaemonStarter._config.guvnor.user).returns({
      uid: 5
    })
    localDaemonStarter._config.guvnor.group = 'group'
    localDaemonStarter._posix.getgrnam.withArgs(localDaemonStarter._config.guvnor.group).returns({
      gid: 5
    })

    localDaemonStarter.start()

    // should have passed the right arguments to spawn
    expect(localDaemonStarter._child_process.spawn.callCount).to.equal(1)
    expect(localDaemonStarter._child_process.spawn.getCall(0).args[1]).to.contain('--debug-brk=' + localDaemonStarter._config.debug.daemon)
  })

  it('should start the daemon with a generated debug port', function () {
    localDaemonStarter._config.debug.daemon = true
    var port = 5

    localDaemonStarter._freeport.callsArgWith(0, undefined, port)

    var daemon = {
      on: sinon.stub(),
      unref: sinon.stub(),
      send: sinon.stub(),
      disconnect: sinon.stub()
    }

    localDaemonStarter._child_process.spawn = sinon.stub()
    localDaemonStarter._child_process.spawn.returns(daemon)

    localDaemonStarter._config.guvnor.user = 'user'
    localDaemonStarter._posix.getpwnam.withArgs(localDaemonStarter._config.guvnor.user).returns({
      uid: 5
    })
    localDaemonStarter._config.guvnor.group = 'group'
    localDaemonStarter._posix.getgrnam.withArgs(localDaemonStarter._config.guvnor.group).returns({
      gid: 5
    })

    localDaemonStarter.start()

    // should have passed the right arguments to spawn
    expect(localDaemonStarter._child_process.spawn.callCount).to.equal(1)
    expect(localDaemonStarter._child_process.spawn.getCall(0).args[1]).to.contain('--debug-brk=' + port)
  })

  it('should pass back error when generating a debug port', function (done) {
    localDaemonStarter._config.debug.daemon = true
    var portError = new Error('nope!')

    localDaemonStarter._freeport.callsArgWith(0, portError)

    localDaemonStarter.start(function (error) {
      expect(error).to.equal(portError)

      done()
    })
  })

  it('should log when disconnecting from the daemon', function () {
    var daemon = {
      on: sinon.stub(),
      unref: sinon.stub(),
      send: sinon.stub(),
      kill: sinon.stub(),
      removeAllListeners: sinon.stub()
    }

    localDaemonStarter._child_process.spawn = sinon.stub()
    localDaemonStarter._child_process.spawn.returns(daemon)

    localDaemonStarter._config.guvnor.user = 'user'
    localDaemonStarter._posix.getpwnam.withArgs(localDaemonStarter._config.guvnor.user).returns({
      uid: 5
    })
    localDaemonStarter._config.guvnor.group = 'group'
    localDaemonStarter._posix.getgrnam.withArgs(localDaemonStarter._config.guvnor.group).returns({
      gid: 5
    })

    localDaemonStarter.start(sinon.stub())

    expect(localDaemonStarter._logger.debug.callCount).to.equal(1)

    expect(daemon.on.getCall(1).args[0]).to.equal('exit')
    daemon.on.getCall(1).args[1]()

    expect(localDaemonStarter._logger.debug.callCount).to.equal(2)

    expect(daemon.on.getCall(2).args[0]).to.equal('close')
    daemon.on.getCall(2).args[1]()

    expect(localDaemonStarter._logger.debug.callCount).to.equal(3)

    expect(daemon.on.getCall(3).args[0]).to.equal('disconnect')
    daemon.on.getCall(3).args[1]()

    expect(localDaemonStarter._logger.debug.callCount).to.equal(4)
  })
})
