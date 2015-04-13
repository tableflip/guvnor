var expect = require('chai').expect,
  sinon = require('sinon'),
  RemoteProcess = require('../../../lib/remote/RemoteProcess')

describe('RemoteProcess', function () {
  var remoteProcess, daemon

  beforeEach(function () {
    daemon = {}

    remoteProcess = new RemoteProcess({}, daemon)
    remoteProcess._logger = {
      debug: sinon.stub()
    }
  })

  it('should have the daemon property', function () {
    expect(remoteProcess._daemon).to.equal(daemon)
  })

  it('should connect to a remote process via the daemon', function (done) {
    var remote = {
      foo: sinon.stub()
    }

    daemon._connectToProcess = sinon.stub().callsArgWith(1, undefined, remote)

    remoteProcess.connect(function (error) {
      expect(error).to.not.exist
      expect(remoteProcess._rpc.foo).to.be.a('function')

      done()
    })
  })

  it('should propagate error when connecting to a remote process', function (done) {
    var error = new Error('Urk!')

    daemon._connectToProcess = sinon.stub().callsArgWith(1, error)

    remoteProcess.connect(function (er) {
      expect(er).to.equal(error)

      done()
    })
  })

  it('should disconnect from remote process', function (done) {
    remoteProcess.disconnect(done)
  })

  it('should disconnect from remote process via rpc', function (done) {
    remoteProcess._rpc.disconnect = sinon.stub().callsArg(0)

    remoteProcess.disconnect(function () {
      expect(remoteProcess._rpc.disconnect.called).to.be.true

      done()
    })
  })
})
