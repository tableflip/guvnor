var expect = require('chai').expect,
  sinon = require('sinon'),
  LocalDaemon = require('../../../lib/local/LocalDaemon')

describe('LocalDaemon', function () {
  var localDaemon

  beforeEach(function () {
    localDaemon = new LocalDaemon()
    localDaemon._logger = {
      info: function () {},
      warn: function () {},
      error: function () {},
      debug: function () {}
    }
    localDaemon._semver = {
      satisfies: sinon.stub()
    }
    localDaemon._processFactory = {}
    localDaemon._localDaemonStarter = {}
    localDaemon._localDaemonAdminConnection = {}
    localDaemon._localDaemonUserConnection = {}
  })

  it('should reject old node versions', function (done) {
    localDaemon._semver.satisfies.returns(false)

    localDaemon.connectOrStart(function (error) {
      expect(error.message).to.contain('Please use node')
      expect(error.message).to.contain('or later')

      done()
    })
  })

  it('should reuse an existing daemon connection', function (done) {
    localDaemon._semver.satisfies.returns(true)
    localDaemon._localDaemonUserConnection.connected = true

    localDaemon.connectOrStart(function (error, remote) {
      expect(error).to.not.exist

      expect(remote).to.equal(localDaemon)

      done()
    })
  })

  it('should connect to a running daemon and expose remote methods', function (done) {
    localDaemon._semver.satisfies.returns(true)
    localDaemon._localDaemonUserConnection.connect = sinon.stub()
    localDaemon._localDaemonUserConnection.connect.callsArgWith(1, undefined, {
      userMethod: function () {}
    })

    localDaemon._localDaemonAdminConnection.connect = sinon.stub()
    localDaemon._localDaemonAdminConnection.connect.callsArgWith(1, undefined, {
      adminMethod: function () {}
    })

    localDaemon.connectOrStart(function (error, remote) {
      expect(error).to.not.exist

      expect(remote).to.equal(localDaemon)

      // should have exposed remote methods
      expect(remote.userMethod).to.be.a('function')
      expect(remote.adminMethod).to.be.a('function')

      done()
    })
  })

  it('should connect to a running daemon and expose only remote user methods', function (done) {
    localDaemon._semver.satisfies.returns(true)
    localDaemon._localDaemonUserConnection.connect = sinon.stub()
    localDaemon._localDaemonUserConnection.connect.callsArgWith(1, undefined, {
      userMethod: function () {}
    })

    var error = new Error('Nope!')
    error.code = 'EACCES'

    localDaemon._localDaemonAdminConnection.connect = sinon.stub()
    localDaemon._localDaemonAdminConnection.connect.callsArgWith(1, error, {
      adminMethod: function () {}
    })

    localDaemon.connect(function (error, remote) {
      expect(error).to.not.exist

      expect(remote).to.equal(localDaemon)

      // should have exposed remote methods
      expect(remote.userMethod).to.be.a('function')
      expect(remote.adminMethod).to.not.exist

      done()
    })
  })

  it('should start a daemon when one is not running', function (done) {
    localDaemon._semver.satisfies.returns(true)

    var notRunningError = new Error('')
    notRunningError.code = 'DAEMON_NOT_RUNNING'

    localDaemon._localDaemonStarter.start = sinon.stub()
    localDaemon._localDaemonStarter.start.callsArgWith(0, undefined, {})

    localDaemon._localDaemonUserConnection.connect = sinon.stub()
    localDaemon._localDaemonUserConnection.connect.onFirstCall().callsArgWith(1, notRunningError)
    localDaemon._localDaemonUserConnection.connect.onSecondCall().callsArgWith(1, undefined, {
      userMethod: function () {}
    })

    localDaemon._localDaemonAdminConnection.connect = sinon.stub()
    localDaemon._localDaemonAdminConnection.connect.callsArgWith(1, undefined, {
      adminMethod: function () {}
    })

    localDaemon.connectOrStart(function (error, remote) {
      expect(error).to.not.exist

      expect(remote).to.equal(localDaemon)

      // should have exposed remote methods
      expect(remote.userMethod).to.be.a('function')
      expect(remote.adminMethod).to.be.a('function')

      done()
    })
  })

  it('should pass error through when starting the daemon fails', function (done) {
    localDaemon._semver.satisfies.returns(true)

    var notRunningError = new Error('')
    notRunningError.code = 'DAEMON_NOT_RUNNING'

    var startingDaemonError = new Error('')

    localDaemon._localDaemonStarter.start = sinon.stub()
    localDaemon._localDaemonStarter.start.callsArgWith(0, startingDaemonError, {})

    localDaemon._localDaemonUserConnection.connect = sinon.stub()
    localDaemon._localDaemonUserConnection.connect.onFirstCall().callsArgWith(1, notRunningError)

    localDaemon.connectOrStart(function (error) {
      expect(error).to.equal(startingDaemonError)
      expect(error).to.not.equal(notRunningError)

      done()
    })
  })

  it('should pass unknown error through when connecting to the daemon fails', function (done) {
    localDaemon._semver.satisfies.returns(true)

    var unknownError = new Error('I AM AN ENIGMA')

    localDaemon._localDaemonUserConnection.connect = sinon.stub()
    localDaemon._localDaemonUserConnection.connect.onFirstCall().callsArgWith(1, unknownError)

    localDaemon.connectOrStart(function (error) {
      expect(error).to.equal(unknownError)

      done()
    })
  })

  it('should disconnect from a daemon', function (done) {
    localDaemon._semver.satisfies.returns(true)

    localDaemon._localDaemonStarter.disconnect = sinon.stub()
    localDaemon._localDaemonStarter.disconnect.callsArgWith(0, undefined)

    localDaemon._localDaemonUserConnection.disconnect = sinon.stub()
    localDaemon._localDaemonUserConnection.disconnect.callsArgWith(0, undefined)

    localDaemon._localDaemonAdminConnection.disconnect = sinon.stub()
    localDaemon._localDaemonAdminConnection.disconnect.callsArgWith(0, undefined)

    localDaemon.disconnect(function (error) {
      expect(error).to.not.exist

      expect(localDaemon._localDaemonStarter.disconnect.calledOnce).to.be.true
      expect(localDaemon._localDaemonUserConnection.disconnect.calledOnce).to.be.true
      expect(localDaemon._localDaemonAdminConnection.disconnect.calledOnce).to.be.true

      done()
    })
  })

  it('should pass received error when disconnecting from a daemon', function (done) {
    localDaemon._semver.satisfies.returns(true)

    var disconnectionError = new Error('urk!')

    localDaemon._localDaemonStarter.disconnect = sinon.stub()
    localDaemon._localDaemonStarter.disconnect.callsArgWith(0, undefined)

    localDaemon._localDaemonUserConnection.disconnect = sinon.stub()
    localDaemon._localDaemonUserConnection.disconnect.callsArgWith(0, disconnectionError)

    localDaemon._localDaemonAdminConnection.disconnect = sinon.stub()
    localDaemon._localDaemonAdminConnection.disconnect.callsArgWith(0, undefined)

    localDaemon.disconnect(function (error) {
      expect(error).to.equal(disconnectionError)

      expect(localDaemon._localDaemonStarter.disconnect.calledOnce).to.be.true
      expect(localDaemon._localDaemonUserConnection.disconnect.calledOnce).to.be.true
      expect(localDaemon._localDaemonAdminConnection.disconnect.calledOnce).to.be.false

      done()
    })
  })

  it('should refuse to connect to a process when not connected to daemon', function (done) {
    localDaemon._semver.satisfies.returns(true)

    var id = 'foo'

    localDaemon.connectToProcess(id, function (error) {
      expect(error).to.be.ok

      done()
    })
  })

  it('should connect to a process when connected to daemon', function (done) {
    localDaemon._semver.satisfies.returns(true)

    var id = 'foo'
    var processInfo = {
      id: id,
      socket: 'bar',
      connect: sinon.stub().callsArg(0)
    }

    localDaemon._localDaemonUserConnection.connected = true

    localDaemon.findProcessInfoById = sinon.stub()
    localDaemon.findProcessInfoById.withArgs(id, sinon.match.func).callsArgWith(1, undefined, processInfo)

    localDaemon.connectToProcess(id, function (error) {
      expect(error).to.not.exist

      done()
    })
  })

  it('should refuse to connect to a process that is not ready', function (done) {
    localDaemon._semver.satisfies.returns(true)

    var id = 'foo'
    var processInfo = {
      id: id
    }

    localDaemon._localDaemonUserConnection.connected = true

    localDaemon.findProcessInfoById = sinon.stub()
    localDaemon.findProcessInfoById.withArgs(id, sinon.match.func).callsArgWith(1, undefined, processInfo)

    localDaemon.connectToProcess(id, function (error) {
      expect(error.message).to.contain('not ready')

      done()
    })
  })

  it('should expose a sendEvent method to the remote daemon that relays events', function (done) {
    localDaemon._semver.satisfies.returns(true)

    var notRunningError = new Error('')
    notRunningError.code = 'DAEMON_NOT_RUNNING'

    localDaemon._localDaemonStarter.start = sinon.stub()
    localDaemon._localDaemonStarter.start.callsArgWith(0, undefined, {})

    localDaemon._localDaemonUserConnection.connect = sinon.stub()
    localDaemon._localDaemonUserConnection.connect.callsArgWith(1, undefined, {
      userMethod: function () {}
    })

    localDaemon._localDaemonAdminConnection.connect = sinon.stub()
    localDaemon._localDaemonAdminConnection.connect.callsArgWith(1, undefined, {
      adminMethod: function () {}
    })

    localDaemon.connectOrStart(function (error, remote) {
      expect(error).to.not.exist

      expect(remote).to.equal(localDaemon)

      // should have exposed remote methods
      expect(remote.userMethod).to.be.a('function')
      expect(remote.adminMethod).to.be.a('function')

      localDaemon.once('foobar', done)

      var remoteApi = localDaemon._localDaemonUserConnection.connect.getCall(0).args[0]
      remoteApi.sendEvent('foobar')
    })
  })
})
