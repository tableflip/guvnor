var sinon = require('sinon'),
  expect = require('chai').expect,
  RemoteProcessLogger = require('../../../../lib/daemon/common/RemoteProcessLogger')

describe('RemoteProcessLogger', function () {
  it('should swallow log if silent option is true', function () {
    var logger = new RemoteProcessLogger({
      silent: true
    })
    logger._parentProcess = {
      send: sinon.stub()
    }

    var stub = sinon.stub()

    logger.log('info', 'hello', null, stub)

    expect(stub.callCount).to.equal(1)
    expect(stub.getCall(0).args[0]).to.equal(null)
    expect(stub.getCall(0).args[1]).to.equal(true)

    expect(logger._parentProcess.send.callCount).to.equal(0)
  })

  it('should send log event to parent process', function () {
    var logger = new RemoteProcessLogger({
      silent: false
    })
    logger._parentProcess = {
      send: sinon.stub()
    }

    var stub = sinon.stub()

    var emittedLogEvent = false

    logger.once('logged', function () {
      emittedLogEvent = true
    })

    logger.log('info', 'hello', null, stub)

    expect(stub.callCount).to.equal(1)
    expect(stub.getCall(0).args[0]).to.equal(null)
    expect(stub.getCall(0).args[1]).to.equal(true)

    expect(logger._parentProcess.send.callCount).to.equal(1)
    expect(logger._parentProcess.send.getCall(0).args[0]).to.equal('process:log:info')
    expect(logger._parentProcess.send.getCall(0).args[1].message).to.equal('hello')

    expect(emittedLogEvent).to.be.true
  })

  it('should not log empty message', function () {
    var logger = new RemoteProcessLogger({
      silent: false
    })
    logger._parentProcess = {
      send: sinon.stub()
    }

    var stub = sinon.stub()

    var emittedLogEvent = false

    logger.once('logged', function () {
      emittedLogEvent = true
    })

    logger.log('info', '', null, stub)

    expect(stub.callCount).to.equal(1)
    expect(stub.getCall(0).args[0]).to.equal(null)
    expect(stub.getCall(0).args[1]).to.equal(true)

    expect(logger._parentProcess.send.callCount).to.equal(0)

    expect(emittedLogEvent).to.be.false
  })
})
