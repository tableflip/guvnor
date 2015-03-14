var expect = require('chai').expect,
  sinon = require('sinon'),
  LocalDaemonConnection = require('../../../lib/local/LocalDaemonConnection')

describe('LocalDaemonConnection', function () {
  var localDaemonConnection, socket

  beforeEach(function () {
    socket = 'socket'

    localDaemonConnection = new LocalDaemonConnection(socket)
    localDaemonConnection._logger = {
      info: function () {
      },
      warn: function () {
      },
      error: function () {
      },
      debug: function () {
      }
    }
    localDaemonConnection._fs = {
      unlink: sinon.stub()
    }
    localDaemonConnection._dnode = sinon.stub()
    localDaemonConnection._config = {
      guvnor: {}
    }
  })

  it('should disconnect from the daemon', function (done) {
    var stream = {
      end: sinon.stub(),
      destroy: sinon.stub()
    }

    localDaemonConnection._client = {
      once: sinon.stub(),
      destroy: function () {
        localDaemonConnection._client.once.getCall(0).args[1]()
      },
      stream: stream
    }
    localDaemonConnection._connected = true

    localDaemonConnection.disconnect(function () {
      expect(localDaemonConnection._client).to.not.exist

      // should have explicitly closed the stream
      expect(stream.end.called).to.be.true
      expect(stream.destroy.called).to.be.true

      done()
    })
  })

  it('should not destroy the client unless connected', function (done) {
    localDaemonConnection.disconnect(function () {
      expect(localDaemonConnection._client).to.not.exist

      done()
    })
  })

  it('should not destroy the client if not connected', function (done) {
    localDaemonConnection._client = {}

    localDaemonConnection.disconnect(function () {
      expect(localDaemonConnection._client).to.be.ok

      done()
    })
  })

  it('should connect', function (done) {
    localDaemonConnection._config.guvnor.rundir = 'run'

    var client = {
      connect: sinon.stub(),
      on: sinon.stub()
    }

    localDaemonConnection._dnode.returns(client)

    var remote = {
      foo: sinon.stub()
    }

    client.connect.withArgs('run/socket', sinon.match.func).callsArgWith(1, remote)

    localDaemonConnection.connect({}, function (error, serverApi) {
      expect(error).to.not.exist

      expect(serverApi.foo).to.be.a('function')

      done()
    })
  })

  it('should handle socket permissions error when connecting', function (done) {
    var permissionsError = new Error('nope!')
    permissionsError.code = 'EACCES'

    var client = {
      connect: sinon.stub(),
      on: sinon.stub()
    }

    localDaemonConnection._dnode.returns(client)

    localDaemonConnection.connect({}, function (error) {
      expect(error.message).to.contain('permission')

      done()
    })

    expect(client.on.getCall(0).args[0]).to.equal('error')
    client.on.getCall(0).args[1](permissionsError)
  })

  it('should handle connection refused error when connecting and delete a stale socket file', function (done) {
    localDaemonConnection._config.guvnor.rundir = 'run'

    var connectionRefusedError = new Error('nope!')
    connectionRefusedError.code = 'ECONNREFUSED'

    var client = {
      connect: sinon.stub(),
      on: sinon.stub()
    }

    localDaemonConnection._dnode.returns(client)

    localDaemonConnection._fs.unlink.withArgs('run/socket', sinon.match.func).callsArgWith(1, undefined)

    localDaemonConnection.connect({}, function (error) {
      expect(error.message).to.contain('not running')
      expect(error.code).to.equal('DAEMON_NOT_RUNNING')

      done()
    })

    expect(client.on.getCall(0).args[0]).to.equal('error')
    client.on.getCall(0).args[1](connectionRefusedError)
  })

  it('should handle connection refused error when connecting and not be able to delete a stale socket file', function (done) {
    localDaemonConnection._config.guvnor.rundir = 'run'

    var connectionRefusedError = new Error('nope!')
    connectionRefusedError.code = 'ECONNREFUSED'

    var client = {
      connect: sinon.stub(),
      on: sinon.stub()
    }

    localDaemonConnection._dnode.returns(client)

    var deleteSocketFileError = new Error('nope!')

    localDaemonConnection._fs.unlink.withArgs('run/socket', sinon.match.func).callsArgWith(1, deleteSocketFileError)

    localDaemonConnection.connect({}, function (error) {
      expect(error).to.equal(deleteSocketFileError)

      done()
    })

    expect(client.on.getCall(0).args[0]).to.equal('error')
    client.on.getCall(0).args[1](connectionRefusedError)
  })

  it('should handle the socket file not existing when connecting', function (done) {
    localDaemonConnection._config.guvnor.rundir = 'run'

    var noSocketFileError = new Error('nope!')
    noSocketFileError.code = 'ENOENT'

    var client = {
      connect: sinon.stub(),
      on: sinon.stub()
    }

    localDaemonConnection._dnode.returns(client)

    localDaemonConnection.connect({}, function (error) {
      expect(error.message).to.contain('not running')
      expect(error.code).to.equal('DAEMON_NOT_RUNNING')

      done()
    })

    expect(client.on.getCall(0).args[0]).to.equal('error')
    client.on.getCall(0).args[1](noSocketFileError)
  })

  it('should handle the socket file not being a socket file when connecting', function (done) {
    localDaemonConnection._config.guvnor.rundir = 'run'

    var notASocketFileError = new Error('nope!')
    notASocketFileError.code = 'ENOTSOCK'

    var client = {
      connect: sinon.stub(),
      on: sinon.stub()
    }

    localDaemonConnection._dnode.returns(client)

    localDaemonConnection.connect({}, function (error) {
      expect(error.message).to.contain('not a socket')

      done()
    })

    expect(client.on.getCall(0).args[0]).to.equal('error')
    client.on.getCall(0).args[1](notASocketFileError)
  })

  it('should handle unknown errors file when connecting', function (done) {
    localDaemonConnection._config.guvnor.rundir = 'run'

    var unknownError = new Error('I AM AN ENIGMA!')
    unknownError.code = 'EENIGMA'

    var client = {
      connect: sinon.stub(),
      on: sinon.stub()
    }

    localDaemonConnection._dnode.returns(client)

    localDaemonConnection.connect({}, function (error) {
      expect(error).to.equal(unknownError)

      done()
    })

    expect(client.on.getCall(0).args[0]).to.equal('error')
    client.on.getCall(0).args[1](unknownError)
  })

  it('should throw an exception if an error is received after connecting', function (done) {
    var unknownError = new Error('I AM AN ENIGMA!')
    unknownError.code = 'EENIGMA'

    localDaemonConnection._connected = true

    var client = {
      connect: sinon.stub(),
      on: sinon.stub()
    }

    localDaemonConnection._dnode.returns(client)

    localDaemonConnection.connect({}, function (error) {
      expect(error).to.equal(unknownError)
    })

    expect(client.on.getCall(0).args[0]).to.equal('error')

    try {
      client.on.getCall(0).args[1](unknownError)
    } catch (e) {
      done()
    }
  })
})
