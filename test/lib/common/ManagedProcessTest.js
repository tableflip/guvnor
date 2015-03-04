var expect = require('chai').expect,
  sinon = require('sinon'),
  Process = require('../../../lib/common/ManagedProcess')

describe('ManagedProcess', function () {
  var proc, socket

  beforeEach(function () {
    socket = 'foo'

    proc = new Process(socket)
    proc._config = {
      guvnor: {
        timeout: 5000
      }
    }
    proc._logger = {
      info: function () {},
      warn: function () {},
      error: function () {},
      debug: function () {}
    }
    proc._dnode = {
      connect: sinon.stub()
    }
  })

  it('should connect to the remote process RPC socket', function (done) {
    var dnode = {
      on: sinon.stub(),
      connect: sinon.stub()
    }

    proc._dnode = function () {
      return dnode
    }

    proc.connect(function (error, remote) {
      expect(error).to.not.exist

      expect(remote.kill).to.be.a('function')

      done()
    })

    expect(dnode.on.calledTwice).to.be.true
    expect(dnode.on.getCall(0).args[0]).to.equal('error')
    expect(dnode.on.getCall(1).args[0]).to.equal('remote')

    var readyCallback = dnode.on.getCall(1).args[1]

    readyCallback({
      foo: function () {}
    })
  })

  it('should defer dnode connection until method is invoked', function (done) {
    var dnode = {
      on: sinon.stub(),
      connect: sinon.stub()
    }

    proc._dnode = function () {
      return dnode
    }

    // should not have interacted with dnode yet
    expect(dnode.on.called).to.be.false

    // invoke the proxied method
    proc.kill(function () {
      expect(dnode.on.calledTwice).to.be.true
      expect(dnode.on.getCall(0).args[0]).to.equal('error')
      expect(dnode.on.getCall(1).args[0]).to.equal('remote')

      done()
    })

    var readyCallback = dnode.on.getCall(1).args[1]

    // simulate dnode having connected
    readyCallback({
      kill: sinon.stub().callsArg(0)
    })
  })

  it('should pass dnode errors to a callback', function (done) {
    var dnode = {
      on: sinon.stub(),
      connect: sinon.stub()
    }

    proc._dnode = function () {
      return dnode
    }

    proc.connect(function (error) {
      expect(error).to.be.ok

      done()
    })

    expect(dnode.on.calledTwice).to.be.true
    expect(dnode.on.getCall(0).args[0]).to.equal('error')
    expect(dnode.on.getCall(1).args[0]).to.equal('remote')

    var errorCallback = dnode.on.getCall(0).args[1]

    errorCallback(new Error('urk!'))
  })

  it('should end the dnode stream on disconnect', function () {
    proc._remote = {
      end: sinon.stub()
    }

    proc.disconnect()

    expect(proc._remote.end.calledOnce).to.be.true
  })
})
