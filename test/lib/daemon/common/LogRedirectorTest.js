var expect = require('chai').expect,
  sinon = require('sinon'),
  path = require('path'),
  LogRedirector = require('../../../../lib/daemon/common/LogRedirector')

describe('LogRedirector', function () {
  var stderr, stdout

  before(function () {
    stderr = process.stderr.write
    stdout = process.stdout.write
  })

  // ProcessWrapper has the side effects of overriding stderr and stdout so restore them after every test
  afterEach(function () {
    process.stderr.write = stderr
    process.stdout.write = stdout

    delete process.send
  })

  var logRedirector

  beforeEach(function () {
    logRedirector = new LogRedirector()
    logRedirector._logger = {
      info: sinon.stub(),
      warn: sinon.stub(),
      error: sinon.stub(),
      debug: sinon.stub()
    }

    // LogRediretor will use the console if a parent process is unavailable
    // so we stub out the parent processes' ipc channel
    process.send = sinon.stub()
  })

  it('should redirect logs', function () {
    var message = 'hello world'

    expect(logRedirector._logger.info.callCount).to.equal(0)
    expect(logRedirector._logger.error.callCount).to.equal(0)

    logRedirector.afterPropertiesSet()

    console.info(message)
    expect(logRedirector._logger.info.callCount).to.equal(1)
    expect(logRedirector._logger.info.getCall(0).args[0]).to.equal(message + '\n')

    console.error(message)
    expect(logRedirector._logger.error.callCount).to.equal(1)
    expect(logRedirector._logger.error.getCall(0).args[0]).to.equal(message + '\n')
  })
})
