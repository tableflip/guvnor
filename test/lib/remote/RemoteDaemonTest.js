var expect = require('chai').expect,
  sinon = require('sinon'),
  RemoteDaemon = require('../../../lib/remote/RemoteDaemon')

describe('RemoteDaemon', function() {
  var remoteDaemon, clock

  beforeEach(function() {
    clock = sinon.useFakeTimers()

    remoteDaemon = new RemoteDaemon()
    remoteDaemon._logger = {
      info: function() {},
      warn: function() {},
      error: function() {},
      debug: function() {}
    }
    remoteDaemon._dnode = sinon.stub()
    remoteDaemon._crypto = {}
    remoteDaemon._tls = {
      connect: sinon.stub()
    }
  })

  afterEach(function() {
    clock.restore()
  })

  it('should connect to a remote daemon if already connected', function(done) {
    remoteDaemon._connected = true

    remoteDaemon.connect(function(error, remote) {
      expect(error).to.not.exist
      expect(remote).to.equal(remoteDaemon)

      done()
    })
  })

  it('should connect to a remote daemon', function(done) {
    var port = 80
    var host = 'foo'

    remoteDaemon._port = port
    remoteDaemon._host = host

    var stream = {
      on: sinon.stub(),
      pipe: sinon.stub()
    }
    stream.pipe.returnsArg(0)

    var d = {
      on: sinon.stub(),
      pipe: sinon.stub()
    }
    d.pipe.returnsArg(0)
    d.on.withArgs('remote', sinon.match.func).callsArgWith(1, {
      foo: sinon.stub()
    })

    remoteDaemon._dnode.returns(d)

    remoteDaemon._tls.connect.returns(stream)

    remoteDaemon.connect(function(error, remote) {
      expect(error).to.not.exist

      expect(d.on.calledWith('remote', sinon.match.func)).to.be.true
      expect(remote.foo).to.be.a('function')

      done()
    })

    expect(remoteDaemon._tls.connect.callCount).to.equal(1)
    expect(remoteDaemon._tls.connect.getCall(0).args[0]).to.equal(port)
    expect(remoteDaemon._tls.connect.getCall(0).args[1].host).to.equal(host)

    remoteDaemon._tls.connect.getCall(0).args[2]({
      foo: sinon.stub()
    })

  })

  it('should call callback when disconnecting from a remote daemon', function(done) {
    var client = {
      end: sinon.stub(),
      once: sinon.stub()
    }
    remoteDaemon._client = client

    remoteDaemon.disconnect(done)

    expect(client.end.callCount).to.equal(1)

    expect(client.once.callCount).to.equal(2)
    expect(client.once.getCall(0).args[0]).to.equal('end')

    expect(remoteDaemon._disconnecting).to.be.true

    client.once.getCall(0).args[1]()
  })

  it('should only end connection once no matter how many times disconnect is invoked', function() {
    var client = {
      end: sinon.stub(),
      once: sinon.stub()
    }
    remoteDaemon._client = client

    var invocations = 0

    var func = function() {
      invocations++
    }

    remoteDaemon.disconnect(func)
    remoteDaemon.disconnect(func)
    remoteDaemon.disconnect(func)

    expect(client.end.callCount).to.equal(1)

    expect(client.once.callCount).to.equal(4)
    client.once.getCall(0).args[1]()
    client.once.getCall(1).args[1]()
    client.once.getCall(2).args[1]()
    client.once.getCall(3).args[1]()

    expect(invocations).to.equal(3)
  })

  it('should call callback when disconnecting from a remote daemon even if not connected', function(done) {
    remoteDaemon.disconnect(done)
  })

  it('should connect to a remote process', function(done) {
    var remoteProcess = {
      foo: sinon.stub
    }
    var processId = 'foo'

    remoteDaemon._connectToProcess = sinon.stub()
    remoteDaemon._connectToProcess.withArgs(processId, sinon.match.func).callsArgWith(1, undefined, remoteProcess)

    remoteDaemon.connectToProcess(processId, function(error, remote) {
      expect(error).to.not.exist
      expect(remote.foo).to.be.a('function')

      done()
    })
  })

  it('should not wrap dumpHeap with timeoutify', function(done) {
    var remoteProcess = {
      dumpHeap: sinon.stub(),
      meh: sinon.stub()
    }
    var processId = 'foo'

    remoteDaemon._connectToProcess = sinon.stub()
    remoteDaemon._connectToProcess.withArgs(processId, sinon.match.func).callsArgWith(1, undefined, remoteProcess)

    remoteDaemon.connectToProcess(processId, function (error, remote) {
      expect(error).to.not.exist

      // wrapped
      expect(remote.meh).to.not.equal(remoteProcess.meh)

      // not wrapped
      expect(remote.dumpHeap).to.equal(remoteProcess.dumpHeap)

      done()
    })
  })

  it('should reconnect to a remote daemon if the connection is refused', function(done) {
    testErrorHandler('ECONNREFUSED', 'CONNECTIONREFUSED', done)
  })

  it('should reconnect to a remote daemon if the connection is reset', function(done) {
    testErrorHandler('ECONNRESET', 'CONNECTIONRESET', done)
  })

  it('should reconnect to a remote daemon if the host is not found', function(done) {
    testErrorHandler('ENOTFOUND', 'HOSTNOTFOUND', done)
  })

  it('should reconnect to a remote daemon if the connection times out', function(done) {
    testErrorHandler('ETIMEDOUT', 'TIMEDOUT', done)
  })

  it('should reconnect to a remote daemon if the network goes away', function(done) {
    testErrorHandler('ENETDOWN', 'NETWORKDOWN', done)
  })

  it('should reconnect to a remote daemon the connection ends and we are not disconnecting', function(done) {
    var stream = {
      on: sinon.stub(),
      pipe: sinon.stub()
    }
    stream.pipe.returnsArg(0)
    remoteDaemon._tls.connect.returns(stream)

    remoteDaemon.connect(function(error) {
      expect(error).to.not.exist

      done()
    })

    expect(remoteDaemon._tls.connect.callCount).to.equal(1)
    expect(stream.on.getCall(1).args[0]).to.equal('end')

    stream.on.getCall(1).args[1]()

    var d = {
      on: sinon.stub(),
      pipe: sinon.stub()
    }
    d.pipe.returnsArg(0)
    remoteDaemon._dnode.returns(d)

    clock.tick(6000)

    // get ready to pretend we've connected to something
    d.on.withArgs('remote').callsArgWith(1, {
      foo: sinon.stub()
    })

    // should have reconnected
    expect(remoteDaemon._tls.connect.callCount).to.equal(2)

    // invoke the connection callback
    remoteDaemon._tls.connect.getCall(1).args[2]()
  })

  it('should sign a message', function(done) {
    var principal = 'principal'
    var secret = 'secret'
    var signature = 'signature'

    remoteDaemon._principal = principal
    remoteDaemon._secret = secret

    remoteDaemon._crypto.sign = sinon.stub()
    remoteDaemon._crypto.sign.withArgs(principal, secret, sinon.match.func).callsArgWith(2, undefined, signature)

    remoteDaemon._signAndInvoke(function(sig, one, two, three) {
      expect(sig).to.equal(signature)
      expect(one).to.equal('one')
      expect(two).to.equal('two')
      expect(three).to.equal('three')

      done()
    }, 'one', 'two', 'three')
  })

  function testErrorHandler(code, friendlyCode, done) {
    var error = new Error('nope!')
    error.code = code

    var stream = {
      on: sinon.stub(),
      pipe: sinon.stub()
    }
    stream.pipe.returnsArg(0)
    remoteDaemon._tls.connect.returns(stream)

    var invocations = 0

    remoteDaemon.connect(function(error) {
      if(invocations == 0) {
        expect(error.message).to.contain('Could not connect')
        expect(error.code).to.equal(friendlyCode)
      } else if(invocations == 1) {
        expect(error).to.not.exist

        done()
      }

      invocations++
    })

    expect(remoteDaemon._tls.connect.callCount).to.equal(1)
    expect(stream.on.getCall(0).args[0]).to.equal('error')

    stream.on.getCall(0).args[1](error)

    var d = {
      on: sinon.stub(),
      pipe: sinon.stub()
    }
    d.pipe.returnsArg(0)
    remoteDaemon._dnode.returns(d)

    clock.tick(6000)

    // get ready to pretend we've connected to something
    d.on.withArgs('remote').callsArgWith(1, {
      foo: sinon.stub()
    })

    // should have reconnected
    expect(remoteDaemon._tls.connect.callCount).to.equal(2)

    // invoke the connection callback
    remoteDaemon._tls.connect.getCall(1).args[2]()
  }
})
