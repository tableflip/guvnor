var should = require('should'),
  sinon = require('sinon'),
  path = require('path'),
  LogRedirector = require('../../../lib/boss/process/LogRedirector')

describe('LogRedirector', function() {
  var stderr, stdout

  before(function() {
    stderr =  process.stderr.write
    stdout =  process.stdout.write
  })

  // ProcessWrapper has the side effects of overriding stderr and stdout so restore them after every test
  afterEach(function() {
    process.stderr.write = stderr
    process.stdout.write = stdout
  })

  var logRedirector

  beforeEach(function() {
    logRedirector = new LogRedirector()
    logRedirector._logger = {
      info: sinon.stub(),
      warn: sinon.stub(),
      error: sinon.stub(),
      debug: sinon.stub()
    }
  })

  it('should redirect logs', function() {
    var message = 'hello world'

    logRedirector._logger.info.callCount.should.equal(0)
    logRedirector._logger.error.callCount.should.equal(0)

    logRedirector.afterPropertiesSet()

    console.info(message)
    logRedirector._logger.info.callCount.should.equal(1)
    logRedirector._logger.info.getCall(0).args[0].should.equal(message + '\n')

    console.error(message)
    logRedirector._logger.error.callCount.should.equal(1)
    logRedirector._logger.error.getCall(0).args[0].should.equal(message + '\n')
  })
})
