var expect = require('chai').expect,
  sinon = require('sinon'),
  inherits = require('util').inherits,
  RPCEndpoint = require('../../../../lib/daemon/rpc/RPCEndpoint'),
  EventEmitter = require('events').EventEmitter,
  async = require('async')

describe('RPCEndpoint', function () {
  var rpc, clock

  beforeEach(function () {
    process.setMaxListeners(0)

    clock = sinon.useFakeTimers()

    rpc = new RPCEndpoint()
    rpc._logger = {
      info: sinon.stub(),
      warn: sinon.stub(),
      error: sinon.stub(),
      debug: sinon.stub()
    }
    rpc._guvnor = {}
    rpc._config = {
      guvnor: {
        group: 'group'
      }
    }
    rpc._processManager = {
      on: sinon.stub()
    }
    rpc._posix = {
      getgrnam: sinon.stub()
    }
    rpc._fs = {
      existsSync: sinon.stub(),
      unlinkSync: sinon.stub(),
      chown: sinon.stub(),
      exists: sinon.stub()
    }
    rpc._dnode = sinon.stub()
    rpc._config = {
      guvnor: {}
    }
    rpc._fileSystem = {
      getRunDir: sinon.stub()
    }
    rpc._userDetailsFactory = {
      create: sinon.stub()
    }
  })

  afterEach(function () {
    clock.restore()
  })

  it('should start dnode', function (done) {
    var directory = 'run'
    rpc._fileSystem.getRunDir.returns(directory)
    var socketPath = directory + '/socket'
    var socket = new EventEmitter()
    var d = new EventEmitter()
    d.listen = sinon.stub()
    d.listen.withArgs({
      path: socketPath
    }).returns(socket)

    rpc._dnode.returns(d)

    rpc.afterPropertiesSet(function (error) {
      expect(error).to.not.exist
      expect(rpc.socket).to.equal(socketPath)

      done()
    })

    var groupId = 42

    rpc._posix.getgrnam.withArgs(rpc._config.guvnor.group).returns({
      gid: groupId
    })
    rpc._fs.chown.withArgs(socketPath, process.getuid(), groupId, sinon.match.func).callsArg(3)

    expect(d.listen.getCall(0).args[0].path).to.equal(socketPath)
    d.listen.getCall(0).args[1]()
  })

  it('should store a client connection and remove when the connection ends', function (done) {
    var directory = 'run'
    rpc._fileSystem.getRunDir.returns(directory)
    var socketPath = directory + '/socket'
    var socket = new EventEmitter()
    var d = new EventEmitter()
    d.listen = sinon.stub()
    d.listen.withArgs({
      path: socketPath
    }).returns(socket)

    rpc._dnode.returns(d)

    var client = {}
    var connection = new EventEmitter()
    connection.id = 'foo'
    connection.stream = new EventEmitter()

    rpc.afterPropertiesSet(function () {
      var connect = rpc._dnode.getCall(0).args[0]
      connect(client, connection)

      expect(rpc._connections[connection.id]).to.be.ok

      connection.emit('end')

      expect(rpc._connections[connection.id]).to.not.exist

      done()
    })

    var groupId = 42

    rpc._posix.getgrnam.withArgs(rpc._config.guvnor.group).returns({
      gid: groupId
    })
    rpc._fs.chown.withArgs(socketPath, process.getuid(), groupId, sinon.match.func).callsArg(3)

    d.listen.getCall(0).args[1]()
  })

  it('should store a client connection and remove when the connection errors', function (done) {
    var directory = 'run'
    rpc._fileSystem.getRunDir.returns(directory)
    var socketPath = directory + '/socket'
    var socket = new EventEmitter()
    var d = new EventEmitter()
    d.listen = sinon.stub()
    d.listen.withArgs({
      path: socketPath
    }).returns(socket)

    rpc._dnode.returns(d)

    var client = {}
    var connection = new EventEmitter()
    connection.id = 'foo'
    connection.stream = new EventEmitter()

    rpc.afterPropertiesSet(function () {
      var connect = rpc._dnode.getCall(0).args[0]
      connect(client, connection)

      expect(rpc._connections[connection.id]).to.be.ok

      connection.emit('error', new Error('urk!'))

      expect(rpc._connections[connection.id]).to.not.exist

      done()
    })

    var groupId = 42

    rpc._posix.getgrnam.withArgs(rpc._config.guvnor.group).returns({
      gid: groupId
    })
    rpc._fs.chown.withArgs(socketPath, process.getuid(), groupId, sinon.match.func).callsArg(3)

    d.listen.getCall(0).args[1]()
  })

  it('should store a client connection and remove when the connection stream errors', function (done) {
    var directory = 'run'
    rpc._fileSystem.getRunDir.returns(directory)
    var socketPath = directory + '/socket'
    var socket = new EventEmitter()
    var d = new EventEmitter()
    d.listen = sinon.stub()
    d.listen.withArgs({
      path: socketPath
    }).returns(socket)

    rpc._dnode.returns(d)

    var client = {}
    var connection = new EventEmitter()
    connection.id = 'foo'
    connection.stream = new EventEmitter()

    rpc.afterPropertiesSet(function () {
      var connect = rpc._dnode.getCall(0).args[0]
      connect(client, connection)

      expect(rpc._connections[connection.id]).to.be.ok

      connection.stream.emit('error', new Error('urk!'))

      expect(rpc._connections[connection.id]).to.not.exist

      done()
    })

    var groupId = 42

    rpc._posix.getgrnam.withArgs(rpc._config.guvnor.group).returns({
      gid: groupId
    })
    rpc._fs.chown.withArgs(socketPath, process.getuid(), groupId, sinon.match.func).callsArg(3)

    d.listen.getCall(0).args[1]()
  })

  it('should expose server methods to client', function (done) {
    var directory = 'run'
    rpc._fileSystem.getRunDir.returns(directory)
    var socketPath = directory + '/socket'
    var socket = new EventEmitter()
    var d = new EventEmitter()
    d.listen = sinon.stub()
    d.listen.withArgs({
      path: socketPath
    }).returns(socket)

    rpc._dnode.returns(d)

    var client = {}
    var connection = new EventEmitter()
    connection.id = 'foo'
    connection.stream = new EventEmitter()

    rpc._generateApi = function () {
      return {
        'foo': sinon.stub(),
        'bar': sinon.stub()
      }
    }

    rpc.afterPropertiesSet(function () {
      var actualClient = {}

      var connect = rpc._dnode.getCall(0).args[0]
      connect.call(actualClient, client, connection)

      expect(actualClient.foo).to.be.a('function')
      expect(actualClient.bar).to.be.a('function')

      done()
    })

    var groupId = 42

    rpc._posix.getgrnam.withArgs(rpc._config.guvnor.group).returns({
      gid: groupId
    })
    rpc._fs.chown.withArgs(socketPath, process.getuid(), groupId, sinon.match.func).callsArg(3)

    d.listen.getCall(0).args[1]()
  })

  it('should generate a server api', function (done) {
    var uid = 5
    var userDetails = {}
    rpc._userDetailsFactory.create.withArgs([5]).callsArgWithAsync(1, undefined, userDetails)

    rpc.foo = sinon.stub().callsArgAsync(1)
    rpc.bar = sinon.stub().callsArgAsync(1)
    rpc._getApi = function () {
      return ['foo', 'bar']
    }

    var api = rpc._generateApi()

    expect(api.foo).to.be.a('function')
    expect(api.bar).to.be.a('function')

    async.parallel([
      api.foo.bind(api, uid), api.bar.bind(api, uid)
    ], function (error) {
      expect(error).to.not.exist

      expect(rpc.foo.calledOnce).to.be.true
      expect(rpc.bar.calledOnce).to.be.true

      done()
    })
  })

  it('should survive a server api method throwing an exception', function (done) {
    var uid = 5
    var userDetails = {}
    rpc._userDetailsFactory.create.withArgs([5]).callsArgWithAsync(1, undefined, userDetails)

    var error = new Error('urk!')

    rpc.foo = sinon.stub().throws(error)

    rpc._getApi = function () {
      return ['foo']
    }

    var api = rpc._generateApi()
    api.foo(uid, function (thrown) {
      expect(thrown).to.equal(error)
      expect(rpc.foo.calledOnce).to.be.true

      done()
    })
  })

  it('should survive calling a non-existent server api method', function () {
    rpc._getApi = function () {
      return ['bar']
    }

    var api = rpc._generateApi()
    api.bar()
  })

  it('should remove socket file', function () {
    var socket = 'socket'
    rpc.socket = socket

    rpc._fs.existsSync.withArgs(socket).returns(true)

    rpc._removeSocketFile()

    expect(rpc._fs.unlinkSync.withArgs(socket).calledOnce).to.be.true
  })

  it("should not remove socket file if it doesn't exist", function () {
    var socket = 'socket'
    rpc.socket = socket

    rpc._fs.existsSync.withArgs(socket).returns(false)

    rpc._removeSocketFile()

    expect(rpc._fs.unlinkSync.called).to.be.false
  })

  it('should broadcast event to connected clients', function () {
    rpc._connections = {
      foo: {
        sendEvent: sinon.stub()
      },
      bar: {
        sendEvent: sinon.stub()
      }
    }

    rpc.broadcast('hello')

    expect(rpc._connections.foo.sendEvent.withArgs('hello').calledOnce).to.be.true
    expect(rpc._connections.bar.sendEvent.withArgs('hello').calledOnce).to.be.true
  })

  it('should drop a new socket file if the current one goes away', function (done) {
    var directory = 'run'
    rpc._fileSystem.getRunDir.returns(directory)
    var socketPath = directory + '/socket'
    var socket = new EventEmitter()
    socket.close = sinon.stub()

    var d = new EventEmitter()
    d.listen = sinon.stub()
    d.listen.withArgs({
      path: socketPath
    }).returns(socket)
    d.destroy = sinon.stub()

    rpc._dnode.returns(d)

    rpc.afterPropertiesSet(function (error) {
      expect(error).to.not.exist
      expect(rpc.socket).to.equal(socketPath)

      rpc._fs.exists.withArgs(socketPath).callsArgWith(1, false)

      // trigger the check for the socket file
      clock.tick(15000)

      expect(socket.close.called).to.be.true
      expect(d.destroy.called).to.be.true
      expect(d.listen.callCount).to.equal(2)

      done()
    })

    var groupId = 42

    rpc._posix.getgrnam.withArgs(rpc._config.guvnor.group).returns({
      gid: groupId
    })
    rpc._fs.chown.withArgs(socketPath, process.getuid(), groupId, sinon.match.func).callsArg(3)

    expect(d.listen.callCount).to.equal(1)
    expect(d.listen.getCall(0).args[0].path).to.equal(socketPath)
    d.listen.getCall(0).args[1]()
  })
})
