var should = require('should'),
  sinon = require('sinon'),
  path = require('path'),
  ExceptionHandler = require('../../../lib/boss/common/ExceptionHandler')

var loggerStub = {
  info: sinon.stub(),
  warn: sinon.stub(),
  error: sinon.stub(),
  debug: sinon.stub()
}
var parentProcessStub = {
  send: sinon.stub()
}

describe('ExceptionHandler', function() {

  it('should notify of uncaught exceptions', function() {
    process.listeners = sinon.stub()
    process.listeners.withArgs('uncaughtException').returns([{}, {}])

    var exceptionHandler = new ExceptionHandler()
    exceptionHandler._logger = loggerStub
    exceptionHandler._parentProcess = parentProcessStub
    exceptionHandler.afterPropertiesSet()

    // the method under test
    exceptionHandler._onUncaughtException({})

    var foundUncaughtExceptionEvent = false;

    for(var i = 0; i < parentProcessStub.send.callCount; i++) {
      var event = parentProcessStub.send.getCall(i).args[0]

      if(event && event.type && event.type == 'process:uncaughtexception') {
        foundUncaughtExceptionEvent = true
      }
    }

    foundUncaughtExceptionEvent.should.equal(true)
  })
})
