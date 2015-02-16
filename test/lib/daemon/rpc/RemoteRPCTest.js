var expect = require('chai').expect,
  sinon = require('sinon'),
  RemoteRPC = require('../../../../lib/daemon/rpc/RemoteRPC'),
  WildEmitter = require('wildemitter'),
  EventEmitter = require('events').EventEmitter

describe('RemoteRPC', function() {
  var remoteRpc

  beforeEach(function () {
    remoteRpc = new RemoteRPC()
    remoteRpc._logger = {
      info: sinon.stub(),
      warn: sinon.stub(),
      error: sinon.stub(),
      debug: sinon.stub()
    }
    remoteRpc._boss = {
      on: sinon.stub(),
      findProcessInfoById: sinon.stub(),
      getServerStatus: sinon.stub(),
      listProcesses: sinon.stub(),
      listApplications: sinon.stub(),
      deployApplication: sinon.stub(),
      removeApplication: sinon.stub(),
      switchApplicationRef: sinon.stub(),
      listApplicationRefs: sinon.stub(),
      updateApplicationRefs: sinon.stub(),
      startProcess: sinon.stub(),
      removeProcess: sinon.stub()
    }
    remoteRpc._processService = {
      on: sinon.stub()
    }
    remoteRpc._appService = {
      on: sinon.stub()
    }
    remoteRpc._dnode = sinon.stub()
    remoteRpc._config = {
      remote: {
        enabled: true
      }
    }
    remoteRpc._remoteUserService = {
      findUser: sinon.stub()
    }
    remoteRpc._crypto = {
      verify: sinon.stub()
    }
    remoteRpc._processFactory = {}
    remoteRpc._child_process = {
      fork: sinon.stub()
    }
    remoteRpc._package = {}
    remoteRpc._nodeInspectorWrapper = {}
    remoteRpc._os = {
      hostname: sinon.stub(),
      type: sinon.stub(),
      platform: sinon.stub(),
      arch: sinon.stub(),
      release: sinon.stub()
    }
    remoteRpc._pem = {
      createCertificate: sinon.stub()
    }
    remoteRpc._tls = {
      createServer: sinon.stub()
    }
    remoteRpc._fs = {
      readFile: sinon.stub()
    }
    remoteRpc._mdns = {
      createAdvertisement: sinon.stub(),
      tcp: sinon.stub()
    }
  })

  it('should not start dnode if remote is not enabled', function(done) {
    remoteRpc._config.remote.enabled = false

    remoteRpc.afterPropertiesSet(function() {
      expect(remoteRpc._dnode.called).to.be.false

      done()
    })
  })

  it('should start dnode', function(done) {
    remoteRpc._config.remote.port = 8080
    remoteRpc._config.remote.host = 'foo'

    remoteRpc._pem.createCertificate.callsArgWith(1, undefined, {
      serviceKey: 'key',
      certificate: 'certificate'
    })

    var server = {
      listen: sinon.stub()
    }
    server.listen.withArgs(
      remoteRpc._config.remote.port,
      remoteRpc._config.remote.host,
      sinon.match.func
    ).callsArgWith(2, undefined)

    remoteRpc._tls.createServer.returns(server)

    remoteRpc.afterPropertiesSet(function(error) {
      expect(error).to.not.exist
      expect(remoteRpc.port).to.equal(remoteRpc._config.remote.port)

      done()
    })
  })

  it('should start dnode with user defined certificates', function (done) {
    remoteRpc._config.remote.port = 8080
    remoteRpc._config.remote.host = 'foo'
    remoteRpc._config.remote.key = 'keyfile'
    remoteRpc._config.remote.certificate = 'certfile'

    remoteRpc._fs.readFile.withArgs(remoteRpc._config.remote.key, sinon.match.func).callsArgWith(1, undefined, 'key')
    remoteRpc._fs.readFile.withArgs(remoteRpc._config.remote.certificate, sinon.match.func).callsArgWith(1, undefined, 'cert')

    var server = {
      listen: sinon.stub()
    }
    server.listen.withArgs(
      remoteRpc._config.remote.port,
      remoteRpc._config.remote.host,
      sinon.match.func
    ).callsArgWith(2, undefined)

    remoteRpc._tls.createServer.returns(server)

    remoteRpc.afterPropertiesSet(function(error) {
      expect(error).to.not.exist
      expect(remoteRpc.port).to.equal(remoteRpc._config.remote.port)
      expect(remoteRpc._pem.createCertificate.called).to.be.false

      // should have used use key
      expect(remoteRpc._tls.createServer.getCall(0).args[0].key).to.equal('key')
      expect(remoteRpc._tls.createServer.getCall(0).args[0].cert).to.equal('cert')

      done()
    })
  })

  it('should broadcast events from boss and the process manager', function (done) {
    remoteRpc._boss = new WildEmitter()
    remoteRpc._processService = new WildEmitter()

    remoteRpc._pem.createCertificate.callsArgWith(1, undefined, {
      serviceKey: 'key',
      certificate: 'certificate'
    })

    var server = {
      listen: sinon.stub()
    }
    server.listen.withArgs(
      remoteRpc._config.remote.port,
      remoteRpc._config.remote.host,
      sinon.match.func
    ).callsArgWith(2, undefined)

    remoteRpc._tls.createServer.returns(server)

    remoteRpc.afterPropertiesSet(function(error) {
      expect(error).to.not.exist

      var events = 0

      remoteRpc._connections = [{
        sendEvent: function () {
          events++

          if (events == 2) {
            done()
          }
        }
      }]

      remoteRpc._boss.emit('foo')
      remoteRpc._processService.emit('bar')
    })
  })

  it('should store a client connection', function (done) {
    var d = {
      pipe: sinon.stub()
    }
    d.pipe.returnsArg(0)
    remoteRpc._dnode.returns(d)

    remoteRpc._pem.createCertificate.callsArgWith(1, undefined, {
      serviceKey: 'key',
      certificate: 'certificate'
    })

    var server = {
      listen: sinon.stub()
    }
    server.listen.withArgs(
      remoteRpc._config.remote.port,
      remoteRpc._config.remote.host,
      sinon.match.func
    ).callsArgWith(2, undefined)

    var stream = new EventEmitter()
    stream.pipe = sinon.stub()
    stream.pipe.returnsArg(0)

    remoteRpc._tls.createServer.callsArgWith(1, stream).returns(server)

    remoteRpc.afterPropertiesSet(function(error) {
      expect(error).to.not.exist

      var client = {}
      var connection = new EventEmitter()
      connection.stream = new EventEmitter()

      remoteRpc._dnode.getCall(0).args[0](client, connection)

      expect(remoteRpc._connections[d._id]).to.equal(client)

      done()
    })
  })

  it('should remove a client connection when the connection ends', function(done) {
    var d = {
      pipe: sinon.stub()
    }
    d.pipe.returnsArg(0)
    remoteRpc._dnode.returns(d)

    remoteRpc._pem.createCertificate.callsArgWith(1, undefined, {
      serviceKey: 'key',
      certificate: 'certificate'
    })

    var server = {
      listen: sinon.stub()
    }
    server.listen.withArgs(
      remoteRpc._config.remote.port,
      remoteRpc._config.remote.host,
      sinon.match.func
    ).callsArgWith(2, undefined)

    var stream = new EventEmitter()
    stream.pipe = sinon.stub()
    stream.pipe.returnsArg(0)

    remoteRpc._tls.createServer.callsArgWith(1, stream).returns(server)

    remoteRpc.afterPropertiesSet(function(error) {
      expect(error).to.not.exist

      var client = {}
      var connection = new EventEmitter()
      connection.id = 'foo'
      connection.stream = new EventEmitter()

      remoteRpc._dnode.getCall(0).args[0](client, connection)

      expect(remoteRpc._connections[d._id]).to.equal(client)

      connection.emit('end')

      expect(remoteRpc._connections[d._id]).to.not.exist

      done()
    })
  })

  it('should remove a client connection when the connection errors', function (done) {
    var d = {
      pipe: sinon.stub()
    }
    d.pipe.returnsArg(0)
    remoteRpc._dnode.returns(d)

    remoteRpc._pem.createCertificate.callsArgWith(1, undefined, {
      serviceKey: 'key',
      certificate: 'certificate'
    })

    var server = {
      listen: sinon.stub()
    }
    server.listen.withArgs(
      remoteRpc._config.remote.port,
      remoteRpc._config.remote.host,
      sinon.match.func
    ).callsArgWith(2, undefined)

    var stream = new EventEmitter()
    stream.pipe = sinon.stub()
    stream.pipe.returnsArg(0)

    remoteRpc._tls.createServer.callsArgWith(1, stream).returns(server)

    remoteRpc.afterPropertiesSet(function (error) {
      expect(error).to.not.exist

      var client = {}
      var connection = new EventEmitter()
      connection.id = 'foo'
      connection.stream = new EventEmitter()

      remoteRpc._dnode.getCall(0).args[0](client, connection)

      expect(remoteRpc._connections[d._id]).to.equal(client)

      connection.emit('error')

      expect(remoteRpc._connections[d._id]).to.not.exist

      done()
    })
  })

  it('should remove a client connection when the stream errors', function (done) {
    var stream = new EventEmitter()
    stream.pipe = sinon.stub()
    stream.pipe.returnsArg(0)

    var d = {
      pipe: sinon.stub()
    }
    d.pipe.returnsArg(0)
    remoteRpc._dnode.returns(d)

    remoteRpc._pem.createCertificate.callsArgWith(1, undefined, {
      serviceKey: 'key',
      certificate: 'certificate'
    })

    var server = {
      listen: sinon.stub()
    }
    server.listen.withArgs(
      remoteRpc._config.remote.port,
      remoteRpc._config.remote.host,
      sinon.match.func
    ).callsArgWith(2, undefined)

    remoteRpc._tls.createServer.callsArgWith(1, stream).returns(server)

    remoteRpc._dnode.returns(d)

    remoteRpc.afterPropertiesSet(function (error) {
      expect(error).to.not.exist

      var client = {}
      var connection = new EventEmitter()
      connection.id = 'foo'
      connection.stream = new EventEmitter()

      remoteRpc._dnode.getCall(0).args[0](client, connection)

      expect(remoteRpc._connections[d._id]).to.equal(client)

      stream.emit('error')

      expect(remoteRpc._connections[d._id]).to.not.exist

      done()
    })
  })

  it('should return server details to the client', function (done) {
    remoteRpc._pem.createCertificate.callsArgWith(1, undefined, {
      serviceKey: 'key',
      certificate: 'certificate'
    })

    var server = {
      listen: sinon.stub()
    }
    server.listen.withArgs(
      remoteRpc._config.remote.port,
      remoteRpc._config.remote.host,
      sinon.match.func
    ).callsArgWith(2, undefined)

    var stream = new EventEmitter()
    stream.pipe = sinon.stub()
    stream.pipe.returnsArg(0)

    remoteRpc._tls.createServer.callsArgWith(1, stream).returns(server)

    var d = {
      pipe: sinon.stub()
    }
    d.pipe.returnsArg(0)

    remoteRpc._dnode.returns(d)

    remoteRpc.afterPropertiesSet(function (error) {
      expect(error).to.not.exist

      var client = {}
      var connection = new EventEmitter()
      connection.id = 'foo'
      connection.stream = new EventEmitter()

      var hostname = 'hostname'
      var type = 'type'
      var platform = 'plaform'
      var arch = 'arch'
      var release = 'release'

      remoteRpc._package.version = '5.0'
      remoteRpc._os.hostname.returns(hostname)
      remoteRpc._os.type.returns(type)
      remoteRpc._os.platform.returns(platform)
      remoteRpc._os.arch.returns(arch)
      remoteRpc._os.release.returns(release)

      var dnode = {}

      remoteRpc._checkSignature = function(callback) {
        callback.apply(null, Array.prototype.slice.call(arguments, 1))
      }

      remoteRpc._dnode.getCall(0).args[0].call(dnode, client, connection)

      var details = dnode.getDetails(function(error, details) {
        expect(error).to.not.exist

        expect(details.hostname).to.equal(hostname)
        expect(details.type).to.equal(type)
        expect(details.platform).to.equal(platform)
        expect(details.arch).to.equal(arch)
        expect(details.release).to.equal(release)
        expect(details.boss).to.equal(remoteRpc._package.version)

        done()
      })
    })
  })

  it('should check an incoming message signature', function (done) {
    var principal = 'principal'
    var date = 'date'
    var hash = 'hash'
    var nonce = 'nonce'
    var user = {
      secret: 'shh'
    }
    var signature = {
      principal: principal,
      date: date,
      hash: hash,
      nonce: nonce
    }

    remoteRpc._remoteUserService.findUser.withArgs(principal, sinon.match.func).callsArgWith(1, undefined, user)
    remoteRpc._crypto.verify.withArgs(signature, user.secret).returns(true)

    remoteRpc._checkSignature(function (one, two, three) {
      expect(one).to.equal('one')
      expect(two).to.equal('two')
      expect(three).to.equal('three')

      done()
    }, signature, 'one', 'two', 'three')
  })

  it('should reject message if signature is invalid', function (done) {
    var principal = 'principal'
    var date = 'date'
    var hash = 'hash'
    var nonce = 'nonce'
    var signature = {
      principal: principal,
      date: date,
      hash: hash
    }

    remoteRpc._checkSignature(function (one, two, three) {

    }, signature, 'one', 'two', 'three', function (error) {
      expect(error.code).to.equal('INVALIDSIGNATURE')

      done()
    })
  })

  it('should reject message if user is unknown', function (done) {
    var principal = 'principal'
    var date = 'date'
    var hash = 'hash'
    var nonce = 'nonce'
    var signature = {
      principal: principal,
      date: date,
      hash: hash,
      nonce: nonce
    }

    remoteRpc._remoteUserService.findUser.withArgs(principal, sinon.match.func).callsArg(1)

    remoteRpc._checkSignature(function (one, two, three) {

    }, signature, 'one', 'two', 'three', function (error) {
      expect(error.code).to.equal('INVALIDSIGNATURE')

      done()
    })
  })

  it('should reject message if there is an error looking up the user', function (done) {
    var principal = 'principal'
    var date = 'date'
    var hash = 'hash'
    var nonce = 'nonce'
    var signature = {
      principal: principal,
      date: date,
      hash: hash,
      nonce: nonce
    }

    remoteRpc._remoteUserService.findUser.withArgs(principal, sinon.match.func).callsArgWith(1, new Error('urk!'))

    remoteRpc._checkSignature(function (one, two, three) {

    }, signature, 'one', 'two', 'three', function (error) {
      expect(error.code).to.equal('INVALIDSIGNATURE')

      done()
    })
  })

  it('should reject message if verification fails', function (done) {
    var principal = 'principal'
    var date = 'date'
    var hash = 'hash'
    var nonce = 'nonce'
    var user = {
      secret: 'shh'
    }
    var signature = {
      principal: principal,
      date: date,
      hash: hash,
      nonce: nonce
    }

    remoteRpc._remoteUserService.findUser.withArgs(principal, sinon.match.func).callsArgWith(1, undefined, user)
    remoteRpc._crypto.verify.withArgs(signature, user.secret).returns(false)

    remoteRpc._checkSignature(function (one, two, three) {

    }, signature, 'one', 'two', 'three', function (error) {
      expect(error.code).to.equal('INVALIDSIGNATURE')

      done()
    })
  })

  it('should connect to a process and invoke a method', function (done) {
    var id = 'id'
    var user = {}
    var processInfo = {}
    var childProcess = new EventEmitter()
    childProcess.kill = sinon.stub()

    remoteRpc._boss.findProcessInfoById.withArgs(id, sinon.match.func).callsArgWith(1, undefined, processInfo)
    remoteRpc._child_process.fork.returns(childProcess)

    remoteRpc.connectToProcess(id, function(error, remote) {
      expect(error).to.not.exist

      // should have exposed methods
      expect(remote.kill).to.be.a('function')
      expect(remote.restart).to.be.a('function')
      expect(remote.send).to.be.a('function')
      expect(remote.reportStatus).to.be.a('function')
      expect(remote.dumpHeap).to.be.a('function')
      expect(remote.forceGc).to.be.a('function')
      expect(remote.setClusterWorkers).to.be.a('function')

      // invoke exposed method
      remote.restart('foo', 'bar', function() {
        // give the parent time to kill the child
        process.nextTick(function() {
          expect(childProcess.kill.calledOnce).to.be.true

          done()
        })
      })
    }, user)

    // stub out how child process would handle method invocation
    childProcess.send = function(event) {
      expect(event.type).to.equal('invoke')
      expect(event.method).to.equal('restart')
      expect(event.args).to.be.an('array')
      expect(event.args[0]).to.equal('foo')
      expect(event.args[1]).to.equal('bar')

      process.nextTick(childProcess.emit.bind(childProcess, 'message', {
        type: 'remote:success'
      }))
    }

    // tell the parent we are ready
    childProcess.emit('message', {
      type: 'remote:ready'
    })
  })

  it('should connect to a process and handle error invoking method', function (done) {
    var id = 'id'
    var user = {}
    var processInfo = {}
    var childProcess = new EventEmitter()
    childProcess.kill = sinon.stub()

    remoteRpc._boss.findProcessInfoById.withArgs(id, sinon.match.func).callsArgWith(1, undefined, processInfo)
    remoteRpc._child_process.fork.returns(childProcess)

    remoteRpc.connectToProcess(id, function(error, remote) {
      expect(error).to.not.exist

      // invoke exposed method
      remote.restart('foo', 'bar', function(error) {
        expect(error.message).to.contain('bail')

        // give the parent time to kill the child
        process.nextTick(function() {
          expect(childProcess.kill.calledOnce).to.be.true

          done()
        })
      })
    }, user)

    // stub out how child process would handle method invocation
    childProcess.send = function(event) {
      process.nextTick(childProcess.emit.bind(childProcess, 'message', {
        type: 'remote:error',
        message: 'bail'
      }))
    }

    // tell the parent we are ready
    childProcess.emit('message', {
      type: 'remote:ready'
    })
  })

  it('should connect to a process and handle uncaught error in process', function (done) {
    var id = 'id'
    var user = {}
    var processInfo = {}
    var childProcess = new EventEmitter()
    childProcess.kill = sinon.stub()

    remoteRpc._boss.findProcessInfoById.withArgs(id, sinon.match.func).callsArgWith(1, undefined, processInfo)
    remoteRpc._child_process.fork.returns(childProcess)

    remoteRpc.connectToProcess(id, function(error) {
      expect(error.message).to.contain('oops')

      done()
    }, user)

    // stub out how child process would handle method invocation
    childProcess.send = function(event) {
      process.nextTick(childProcess.emit.bind(childProcess, 'message', {
        type: 'remote:error',
        message: 'bail'
      }))
    }

    // tell the parent we are ready
    childProcess.emit('error', new Error('oops'))
  })

  it('should connect to a process and handle non-zero exit code', function (done) {
    var id = 'id'
    var user = {}
    var processInfo = {}
    var childProcess = new EventEmitter()
    childProcess.kill = sinon.stub()

    remoteRpc._boss.findProcessInfoById.withArgs(id, sinon.match.func).callsArgWith(1, undefined, processInfo)
    remoteRpc._child_process.fork.returns(childProcess)

    remoteRpc.connectToProcess(id, function(error) {
      expect(error.message).to.contain('with code')

      done()
    }, user)

    // stub out how child process would handle method invocation
    childProcess.send = function(event) {
      process.nextTick(childProcess.emit.bind(childProcess, 'message', {
        type: 'remote:error',
        message: 'bail'
      }))
    }

    // tell the parent we are ready
    childProcess.emit('exit', 1)
  })

  it('should start mdns advert', function() {
    var advert = {
      start: sinon.stub()
    }
    var value = true
    remoteRpc._config.remote.advertise = true
    remoteRpc._mdns.createAdvertisement.withArgs(value, remoteRpc.port).returns(advert)
    remoteRpc._mdns.tcp.withArgs('boss-rpc').returns(value)

    remoteRpc._startMdnsAdvertisment()

    expect(remoteRpc._mdns.createAdvertisement.called).to.be.true
    expect(advert.start.called).to.be.true
  })

  it('should survive mdns advert failure', function() {
    var value = true
    remoteRpc._config.remote.advertise = true
    remoteRpc._mdns.createAdvertisement.throws(new Error('urk!'))
    remoteRpc._mdns.tcp.withArgs('boss-rpc').returns(value)

    remoteRpc._startMdnsAdvertisment()
  })
})