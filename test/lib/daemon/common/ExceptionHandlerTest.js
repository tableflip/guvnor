var expect = require('chai').expect
sinon = require('sinon'),
path = require('path'),
ExceptionHandler = require('../../../../lib/daemon/common/ExceptionHandler')

var loggerStub = {
  info: sinon.stub(),
  warn: sinon.stub(),
  error: sinon.stub(),
  debug: sinon.stub()
}
var parentProcessStub = {
  send: sinon.stub()
}

describe('ExceptionHandler', function () {

  it('should notify of uncaught exceptions', function () {
    process.listeners = sinon.stub()
    process.listeners.withArgs('uncaughtException').returns([{}, {}])

    var exceptionHandler = new ExceptionHandler()
    exceptionHandler._logger = loggerStub
    exceptionHandler._parentProcess = parentProcessStub
    exceptionHandler.afterPropertiesSet()

    // the method under test
    exceptionHandler._onUncaughtException({})

    var foundUncaughtExceptionEvent = false

    for (var i = 0; i < parentProcessStub.send.callCount; i++) {
      var event = parentProcessStub.send.getCall(i).args[0]

      if (event == 'process:uncaughtexception') {
        foundUncaughtExceptionEvent = true
      }
    }

    expect(foundUncaughtExceptionEvent).to.equal(true)
  })
})
