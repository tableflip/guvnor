var expect = require('chai').expect,
  sinon = require('sinon'),
  RemoteRPC = require('../../../../lib/daemon/rpc/RemoteRPC'),
  WildEmitter = require('wildemitter'),
  EventEmitter = require('events').EventEmitter

describe('RemoteRPC', function () {
  var remoteRpc

  beforeEach(function () {
    remoteRpc = new RemoteRPC()
    remoteRpc._logger = {
      info: sinon.stub(),
      warn: sinon.stub(),
      error: sinon.stub(),
      debug: sinon.stub()
    }
    remoteRpc._guvnor = {
      on: sinon.stub(),
      findProcessInfoById: sinon.stub(),
      findProcessInfoByName: sinon.stub(),
      findProcessInfoByPid: sinon.stub(),
      findAppById: sinon.stub(),
      findAppByName: sinon.stub(),
      getServerStatus: sinon.stub(),
      listProcesses: sinon.stub(),
      listApplications: sinon.stub(),
      deployApplication: sinon.stub(),
      removeApplication: sinon.stub(),
      switchApplicationRef: sinon.stub(),
      listApplicationRefs: sinon.stub(),
      updateApplicationRefs: sinon.stub(),
      startProcess: sinon.stub(),
      removeProcess: sinon.stub(),
      currentRef: sinon.stub(),
      listUsers: sinon.stub(),
      stopProcess: sinon.stub()
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
      },
      guvnor: {
        rpctimeout: 0
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
      fork: sinon.stub(),
      exec: sinon.stub()
    }
    remoteRpc._package = {}
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
    remoteRpc._userDetailsStore = {
      findOrCreate: sinon.stub()
    }
    remoteRpc._fileSystem = {
      getRunDir: sinon.stub()
    }
  })

  it('should not start dnode if remote is not enabled', function (done) {
    remoteRpc._config.remote.enabled = false

    remoteRpc.afterPropertiesSet(function () {
      expect(remoteRpc._dnode.called).to.be.false

      done()
    })
  })

  it('should start dnode', function (done) {
    remoteRpc._config.remote.port = 8080
    remoteRpc._config.remote.host = 'foo'

    remoteRpc._pem.createCertificate.callsArgWith(1, undefined, {
      serviceKey: 'key',
      certificate: 'certificate'
    })

    var server = {
      listen: sinon.stub(),
      on: sinon.stub()
    }
    server.listen.withArgs(
      remoteRpc._config.remote.port,
      remoteRpc._config.remote.host,
      sinon.match.func
    ).callsArgWith(2, undefined)

    remoteRpc._tls.createServer.returns(server)

    remoteRpc.afterPropertiesSet(function (error) {
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
      listen: sinon.stub(),
      on: sinon.stub()
    }
    server.listen.withArgs(
      remoteRpc._config.remote.port,
      remoteRpc._config.remote.host,
      sinon.match.func
    ).callsArgWith(2, undefined)

    remoteRpc._tls.createServer.returns(server)

    remoteRpc.afterPropertiesSet(function (error) {
      expect(error).to.not.exist
      expect(remoteRpc.port).to.equal(remoteRpc._config.remote.port)
      expect(remoteRpc._pem.createCertificate.called).to.be.false

      // should have used use key
      expect(remoteRpc._tls.createServer.getCall(0).args[0].key).to.equal('key')
      expect(remoteRpc._tls.createServer.getCall(0).args[0].cert).to.equal('cert')

      done()
    })
  })

  it('should broadcast events from guvnor and the process manager', function (done) {
    remoteRpc._guvnor = new WildEmitter()
    remoteRpc._processService = new WildEmitter()

    remoteRpc._pem.createCertificate.callsArgWith(1, undefined, {
      serviceKey: 'key',
      certificate: 'certificate'
    })

    var server = {
      listen: sinon.stub(),
      on: sinon.stub()
    }
    server.listen.withArgs(
      remoteRpc._config.remote.port,
      remoteRpc._config.remote.host,
      sinon.match.func
    ).callsArgWith(2, undefined)

    remoteRpc._tls.createServer.returns(server)

    remoteRpc.afterPropertiesSet(function (error) {
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

      remoteRpc._guvnor.emit('foo')
      remoteRpc._processService.emit('bar')
    })
  })

  it('should store a client connection', function (done) {
    var d = {
      pipe: sinon.stub(),
      on: sinon.stub()
    }
    d.pipe.returnsArg(0)
    remoteRpc._dnode.returns(d)

    remoteRpc._pem.createCertificate.callsArgWith(1, undefined, {
      serviceKey: 'key',
      certificate: 'certificate'
    })

    var server = {
      listen: sinon.stub(),
      on: sinon.stub()
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
      connection.stream = new EventEmitter()

      remoteRpc._dnode.getCall(0).args[0](client, connection)

      expect(remoteRpc._connections[d._id]).to.equal(client)

      done()
    })
  })

  it('should remove a client connection when the connection ends', function (done) {
    var d = {
      pipe: sinon.stub(),
      on: sinon.stub()
    }
    d.pipe.returnsArg(0)
    remoteRpc._dnode.returns(d)

    remoteRpc._pem.createCertificate.callsArgWith(1, undefined, {
      serviceKey: 'key',
      certificate: 'certificate'
    })

    var server = {
      listen: sinon.stub(),
      on: sinon.stub()
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

      connection.emit('end')

      expect(remoteRpc._connections[d._id]).to.not.exist

      done()
    })
  })

  it('should remove a client connection when the connection errors', function (done) {
    var d = {
      pipe: sinon.stub(),
      on: sinon.stub(),
      destroy: sinon.stub()
    }
    d.pipe.returnsArg(0)
    remoteRpc._dnode.returns(d)

    remoteRpc._pem.createCertificate.callsArgWith(1, undefined, {
      serviceKey: 'key',
      certificate: 'certificate'
    })

    var server = {
      listen: sinon.stub(),
      on: sinon.stub()
    }
    server.listen.withArgs(
      remoteRpc._config.remote.port,
      remoteRpc._config.remote.host,
      sinon.match.func
    ).callsArgWith(2, undefined)

    var stream = new EventEmitter()
    stream.pipe = sinon.stub()
    stream.pipe.returnsArg(0)
    stream.destroy = sinon.stub()

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
      expect(d.destroy.called).to.be.true
      expect(stream.destroy.called).to.be.true

      done()
    })
  })

  it('should remove a client connection when the stream errors', function (done) {
    var stream = new EventEmitter()
    stream.pipe = sinon.stub()
    stream.pipe.returnsArg(0)

    var d = {
      pipe: sinon.stub(),
      on: sinon.stub(),
      destroy: sinon.stub()
    }
    d.pipe.returnsArg(0)
    remoteRpc._dnode.returns(d)

    remoteRpc._pem.createCertificate.callsArgWith(1, undefined, {
      serviceKey: 'key',
      certificate: 'certificate'
    })

    var server = {
      listen: sinon.stub(),
      on: sinon.stub()
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
      expect(d.destroy.called).to.be.true

      done()
    })
  })

  it('should remove a client connection when dnode errors', function (done) {
    var stream = {
      pipe: sinon.stub().returnsArg(0),
      on: sinon.stub(),
      destroy: sinon.stub()
    }

    var d = new EventEmitter()
    d.pipe = sinon.stub()
    d.pipe.returnsArg(0)

    d.pipe.returnsArg(0)
    remoteRpc._dnode.returns(d)

    remoteRpc._pem.createCertificate.callsArgWith(1, undefined, {
      serviceKey: 'key',
      certificate: 'certificate'
    })

    var server = {
      listen: sinon.stub(),
      on: sinon.stub()
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

      d.emit('error')

      expect(remoteRpc._connections[d._id]).to.not.exist
      expect(stream.destroy.called).to.be.true

      done()
    })
  })

  it('should return server details to the client', function (done) {
    remoteRpc._pem.createCertificate.callsArgWith(1, undefined, {
      serviceKey: 'key',
      certificate: 'certificate'
    })

    var server = {
      listen: sinon.stub(),
      on: sinon.stub()
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
      pipe: sinon.stub(),
      on: sinon.stub()
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

      remoteRpc._child_process.exec.withArgs('uname -a').callsArgWithAsync(1, undefined, 'Darwin Alexs-MBP.home 14.1.0 Darwin Kernel Version 14.1.0: Mon Dec 22 23:10:38 PST 2014; root:xnu-2782.10.72~2/RELEASE_X86_64 x86_64')

      var dnode = {}

      remoteRpc._checkSignature = function (callback) {
        callback.apply(null, Array.prototype.slice.call(arguments, 1))
      }

      remoteRpc._dnode.getCall(0).args[0].call(dnode, client, connection)

      dnode.getDetails({}, function (error, details) {
        expect(error).to.not.exist

        expect(details.hostname).to.equal(hostname)
        expect(details.type).to.equal(type)
        expect(details.platform).to.equal(platform)
        expect(details.arch).to.equal(arch)
        expect(details.release).to.equal(release)
        expect(details.guvnor).to.equal(remoteRpc._package.version)
        expect(details.os).to.equal('darwin')

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
      secret: 'shh',
      name: principal
    }
    var signature = {
      principal: principal,
      date: date,
      hash: hash,
      nonce: nonce
    }
    var userDetails = {}
    remoteRpc._userDetailsStore.findOrCreate.withArgs('name', user.name, [user.name]).callsArgWithAsync(3, undefined, userDetails)

    remoteRpc._remoteUserService.findUser.withArgs(principal, sinon.match.func).callsArgWithAsync(1, undefined, user)
    remoteRpc._crypto.verify.withArgs(signature, user.secret).returns(true)

    remoteRpc._checkSignature(function (details, one, two, three) {
      expect(details).to.equal(userDetails)
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
    var userDetails = {}
    remoteRpc._userDetailsStore.findOrCreate.withArgs('name', user.name, [user.name]).callsArgWithAsync(3, undefined, userDetails)

    remoteRpc._remoteUserService.findUser.withArgs(principal, sinon.match.func).callsArgWith(1, undefined, user)
    remoteRpc._crypto.verify.withArgs(signature, user.secret).returns(false)

    remoteRpc._checkSignature(function (details, one, two, three) {
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
    childProcess.stdout = new EventEmitter()
    childProcess.stdout.end = sinon.stub()
    childProcess.stdout.pipe = sinon.stub().returnsArg(0)
    childProcess.stdin = new EventEmitter()
    var userDetails = {}
    var dnode = new EventEmitter()
    dnode.pipe = sinon.stub().returnsArg(0)

    remoteRpc._dnode.returns(dnode)
    remoteRpc._guvnor.findProcessInfoById.withArgs(userDetails, id, sinon.match.func).callsArgWith(2, undefined, processInfo)
    remoteRpc._child_process.fork.returns(childProcess)

    remoteRpc.connectToProcess(userDetails, id, function (error, remote) {
      expect(error).to.not.exist

      // should have exposed methods
      expect(remote.restart).to.be.a('function')
      expect(remote.disconnect).to.be.a('function')

      // invoke exposed method
      remote.disconnect(function () {
        expect(childProcess.kill.calledOnce).to.be.true

        done()
      })
    }, user)

    // tell the parent we are ready
    childProcess.emit('message', {
      type: 'remote:ready'
    })

    // make like dnode has connected to the tunnel
    dnode.emit('remote', {
      restart: sinon.stub()
    })
  })

  it('should handle an internal error connecting to a process', function (done) {
    var id = 'id'
    var message = 'message'
    var code = 'code'
    var stack = 'stack'
    var user = {}
    var processInfo = {}
    var childProcess = new EventEmitter()
    childProcess.kill = sinon.stub()
    childProcess.stdout = new EventEmitter()
    childProcess.stdout.end = sinon.stub()
    childProcess.stdout.pipe = sinon.stub().returnsArg(0)
    childProcess.stdin = new EventEmitter()
    var userDetails = {}

    remoteRpc._guvnor.findProcessInfoById.withArgs(userDetails, id, sinon.match.func).callsArgWith(2, undefined, processInfo)
    remoteRpc._child_process.fork.returns(childProcess)

    remoteRpc.connectToProcess(userDetails, id, function (error) {
      expect(error).to.be.ok
      expect(error.message).to.equal(message)
      expect(error.stack).to.equal(stack)
      expect(error.code).to.equal(code)

      done()
    }, user)

    // simulate error
    childProcess.emit('message', {
      type: 'remote:error',
      args: [{
        message: message,
        code: code,
        stack: stack
      }]
    })
  })

  it('should connect to a process and handle uncaught error in process', function (done) {
    var id = 'id'
    var user = {}
    var processInfo = {}
    var childProcess = new EventEmitter()
    childProcess.kill = sinon.stub()
    childProcess.stdout = new EventEmitter()
    childProcess.stdout.end = sinon.stub()
    childProcess.stdout.pipe = sinon.stub().returnsArg(0)
    childProcess.stdin = new EventEmitter()
    var userDetails = {}
    var dnode = new EventEmitter()
    dnode.pipe = sinon.stub().returnsArg(0)

    remoteRpc._dnode.returns(dnode)
    remoteRpc._guvnor.findProcessInfoById.withArgs(userDetails, id, sinon.match.func).callsArgWith(2, undefined, processInfo)
    remoteRpc._child_process.fork.returns(childProcess)

    remoteRpc.connectToProcess(userDetails, id, function (error) {
      expect(error.message).to.contain('oops')

      done()
    }, user)

    // simulate the child process emitting an error
    childProcess.emit('error', new Error('oops'))
  })

  it('should connect to a process and handle non-zero exit code', function (done) {
    var id = 'id'
    var user = {}
    var processInfo = {}
    var childProcess = new EventEmitter()
    childProcess.kill = sinon.stub()
    childProcess.stdout = new EventEmitter()
    childProcess.stdout.end = sinon.stub()
    childProcess.stdout.pipe = sinon.stub().returnsArg(0)
    childProcess.stdin = new EventEmitter()
    var userDetails = {}
    var dnode = new EventEmitter()
    dnode.pipe = sinon.stub().returnsArg(0)

    remoteRpc._dnode.returns(dnode)
    remoteRpc._guvnor.findProcessInfoById.withArgs(userDetails, id, sinon.match.func).callsArgWith(2, undefined, processInfo)
    remoteRpc._child_process.fork.returns(childProcess)

    remoteRpc.connectToProcess(userDetails, id, function (error) {
      expect(error.message).to.contain('with code')

      done()
    }, user)

    // simulate the child process exiting badly
    childProcess.emit('exit', 1)
  })

  it('should start mdns advert', function () {
    var advert = new EventEmitter()
    advert.start = sinon.stub()
    var value = true
    remoteRpc._config.remote.advertise = true
    remoteRpc._mdns.createAdvertisement.withArgs(value, remoteRpc.port).returns(advert)
    remoteRpc._mdns.tcp.withArgs('guvnor-rpc').returns(value)

    remoteRpc._startMdnsAdvertisment()

    expect(remoteRpc._mdns.createAdvertisement.called).to.be.true
    expect(advert.start.called).to.be.true
  })

  it('should survive mdns advert failure', function () {
    var value = true
    remoteRpc._config.remote.advertise = true
    remoteRpc._mdns.createAdvertisement.throws(new Error('urk!'))
    remoteRpc._mdns.tcp.withArgs('guvnor-rpc').returns(value)

    remoteRpc._startMdnsAdvertisment()
  })

  it('should survive mdns advert emitting error', function () {
    var advert = new EventEmitter()
    advert.start = sinon.stub()
    var value = true
    remoteRpc._config.remote.advertise = true
    remoteRpc._mdns.createAdvertisement.withArgs(value, remoteRpc.port).returns(advert)
    remoteRpc._mdns.tcp.withArgs('guvnor-rpc').returns(value)

    remoteRpc._startMdnsAdvertisment()

    advert.emit('error', new Error('Urk!'))
  })

  it('should start a process', function (done) {
    var user = 'foo'
    var userDetails = {
      name: user
    }
    var script = 'script'
    var options = {
      user: user
    }
    var processInfo = 'processInfo'

    var guvnor = {
      startProcess: sinon.stub().callsArgWith(3, undefined, processInfo),
      disconnect: sinon.stub()
    }

    remoteRpc._fileSystem.getRunDir.returns('run')
    remoteRpc._connectToRpc = sinon.stub().callsArgWith(3, undefined, guvnor)

    remoteRpc._startProcess(userDetails, script, options, function (error, proc) {
      expect(error).to.not.exist
      expect(proc).to.equal(processInfo)

      expect(remoteRpc._connectToRpc.calledWith('run/user.socket')).to.be.true

      done()
    })
  })

  it('should start a process as a different user', function (done) {
    var user = 'foo'
    var userDetails = {
      name: user
    }
    var script = 'script'
    var options = {
      user: 'bar'
    }
    var processInfo = 'processInfo'

    var guvnor = {
      startProcess: sinon.stub().callsArgWith(3, undefined, processInfo),
      disconnect: sinon.stub()
    }

    remoteRpc._fileSystem.getRunDir.returns('run')
    remoteRpc._connectToRpc = sinon.stub().callsArgWith(3, undefined, guvnor)

    remoteRpc._startProcess(userDetails, script, options, function (error, proc) {
      expect(error).to.not.exist
      expect(proc).to.equal(processInfo)

      expect(remoteRpc._connectToRpc.calledWith('run/admin.socket')).to.be.true

      done()
    })
  })
})
