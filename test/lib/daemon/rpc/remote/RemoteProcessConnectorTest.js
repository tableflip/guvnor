var expect = require('chai').expect,
  sinon = require('sinon'),
  inherits = require('util').inherits,
  RemoteProcessConnector = require('../../../../../lib/daemon/rpc/remote/RemoteProcessConnector'),
  posix = require('posix')

describe('RemoteProcessConnector', function () {

  it('should execute a remote process', function (done) {
    var connector = new RemoteProcessConnector()
    connector._managedProcessFactory = {
      create: sinon.stub()
    }
    connector._posix = posix

    process.env.GUVNOR_USER = process.getuid().toString()
    process.env.GUVNOR_SOCKET = '/sock'
    process.send = sinon.stub()
    process.on = sinon.stub()

    var remoteProcess = {
      foo: function (five, six, seven, callback) {
        expect(five).to.equal(5)
        expect(six).to.equal(6)
        expect(seven).to.equal(7)

        callback()
      },
      disconnect: done,
      connect: sinon.stub()
    }

    connector._managedProcessFactory.create.withArgs(['/sock'], sinon.match.func).callsArgWith(1, undefined, remoteProcess)
    remoteProcess.connect.withArgs(sinon.match.func).callsArgWith(0, undefined, remoteProcess)

    connector.afterPropertiesSet()

    expect(process.on.callCount).to.equal(1)
    expect(process.on.getCall(0).args[0]).to.equal('message')

    var callback = process.on.getCall(0).args[1]

    callback({
      type: 'invoke',
      method: 'foo',
      args: [5, 6, 7]
    })
  })

  it('should pass callback arguments to parent process', function (done) {
    var connector = new RemoteProcessConnector()
    connector._managedProcessFactory = {
      create: sinon.stub()
    }
    connector._posix = posix

    process.env.GUVNOR_USER = process.getuid().toString()
    process.env.GUVNOR_SOCKET = '/sock'
    process.send = sinon.stub()
    process.on = sinon.stub()

    var remoteProcess = {
      foo: function (five, six, seven, callback) {
        expect(five).to.equal(5)
        expect(six).to.equal(6)
        expect(seven).to.equal(7)

        callback(undefined, 8, 9, 10)
      },
      disconnect: function () {
        expect(process.send.callCount).to.equal(2)
        expect(process.send.getCall(0).args[0].event).to.equal('remote:ready')
        expect(process.send.getCall(1).args[0].event).to.equal('remote:success')
        expect(process.send.getCall(1).args[0].args[0]).to.not.exist
        expect(process.send.getCall(1).args[0].args[1]).to.equal(8)
        expect(process.send.getCall(1).args[0].args[2]).to.equal(9)
        expect(process.send.getCall(1).args[0].args[3]).to.equal(10)

        done()
      },
      connect: sinon.stub()
    }

    connector._managedProcessFactory.create.withArgs(['/sock'], sinon.match.func).callsArgWith(1, undefined, remoteProcess)
    remoteProcess.connect.withArgs(sinon.match.func).callsArgWith(0, undefined, remoteProcess)

    connector.afterPropertiesSet()

    expect(process.on.callCount).to.equal(1)
    expect(process.on.getCall(0).args[0]).to.equal('message')

    var callback = process.on.getCall(0).args[1]

    callback({
      method: 'foo',
      args: [5, 6, 7]
    })
  })

  it('should pass error to parent process', function () {
    var connector = new RemoteProcessConnector()
    connector._posix = {
      getpwnam: function () {
        throw new Error('Suprise!')
      }
    }

    process.send = sinon.stub()
    process.on = sinon.stub()

    connector.afterPropertiesSet()

    expect(process.send.callCount).to.equal(1)
    expect(process.send.getCall(0).args[0].event).to.equal('remote:error')
    expect(process.send.getCall(0).args[0].args[0].message).to.equal('Suprise!')
    expect(process.send.getCall(0).args[0].args[0].stack).to.be.ok
  })

  it('should emit an error when remote method name is wrong', function () {
    var connector = new RemoteProcessConnector()
    connector._managedProcessFactory = {
      create: sinon.stub()
    }
    connector._posix = posix

    process.env.GUVNOR_USER = process.getuid().toString()
    process.env.GUVNOR_SOCKET = '/sock'
    process.send = sinon.stub()
    process.on = sinon.stub()

    var remoteProcess = {
      connect: sinon.stub(),
      disconnect: sinon.stub()
    }

    connector._managedProcessFactory.create.withArgs(['/sock'], sinon.match.func).callsArgWith(1, undefined, remoteProcess)

    connector.afterPropertiesSet()

    expect(process.send.calledOnce).to.be.true
    expect(process.send.getCall(0).args[0].event).to.equal('remote:ready')

    var callback = process.on.getCall(0).args[1]

    callback({
      method: 'non existent method name',
      args: []
    })

    expect(process.send.calledTwice).to.be.true
    expect(process.send.getCall(1).args[0].event).to.equal('remote:error')
    expect(process.send.getCall(1).args[0].args[0].message).to.equal('Invalid method name')
    expect(process.send.getCall(1).args[0].args[0].stack).to.be.ok
  })
})
