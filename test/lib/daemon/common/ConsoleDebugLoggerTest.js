var sinon = require('sinon'),
  expect = require('chai').expect,
  proxyquire = require('proxyquire')

describe('ConsoleDebugLogger', function () {
  it('should swallow log if silent option is true', function () {
    var ConsoleDebugLogger = require('../../../../lib/daemon/common/ConsoleDebugLogger')
    var logger = new ConsoleDebugLogger({
      silent: true
    })

    var stub = sinon.stub()

    logger.log(null, null, null, stub)

    expect(stub.callCount).to.equal(1)
    expect(stub.getCall(0).args[0]).to.equal(null)
    expect(stub.getCall(0).args[1]).to.equal(true)
  })

  it('should defer to console if there is no parent process', function () {
    var stubs = {
      winston: {
        transports: {
          Console: function () {
          }
        }
      }
    }

    var ConsoleDebugLogger = proxyquire('../../../../lib/daemon/common/ConsoleDebugLogger', stubs)
    var logger = new ConsoleDebugLogger({
      silent: false
    })

    stubs.winston.transports.Console.prototype.log = sinon.stub()

    logger.log('foo')

    expect(stubs.winston.transports.Console.prototype.log.callCount).to.equal(1)
    expect(stubs.winston.transports.Console.prototype.log.getCall(0).args[0]).to.equal('foo')
  })

  it('should swallow log if process.send is defined', function () {
    var stubs = {
      winston: {
        transports: {
          Console: function () {
          }
        }
      }
    }

    var ConsoleDebugLogger = proxyquire('../../../../lib/daemon/common/ConsoleDebugLogger', stubs)
    var logger = new ConsoleDebugLogger({
      silent: false
    })

    var original = process.send
    var stub = sinon.stub()
    process.send = sinon.stub()

    logger.log(null, null, null, stub)

    process.send = original

    expect(stub.callCount).to.equal(1)
    expect(stub.getCall(0).args[0]).to.equal(null)
    expect(stub.getCall(0).args[1]).to.equal(true)
  })
})
