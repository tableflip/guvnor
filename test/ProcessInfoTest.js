var should = require('should'),
  sinon = require('sinon'),
  ProcessInfo = require('../lib/boss/ProcessInfo')

describe('ProcessInfo', function() {
  var fileSystemStub = {findOrCreateLogFileDirectory: sinon.stub()}

  it('should recover the process after crash recovery period', function(done) {
    var processInfo = new ProcessInfo('test.js', sinon.stub(), {
      crashRecoveryPeriod: 500
    }, fileSystemStub)
    processInfo._logger = {
      info: sinon.stub(),
      warn: sinon.stub(),
      error: sinon.stub(),
      debug: sinon.stub(),
      log: sinon.stub()
    }

    processInfo.restarts.should.equal(0)
    processInfo.totalRestarts.should.equal(0)

    // Method under test
    processInfo.stillCrashing()

    processInfo.restarts.should.equal(1)
    processInfo.totalRestarts.should.equal(1)

    // After the crash recovery period, restarts should be reset
    setTimeout(function() {
      processInfo.restarts.should.equal(0)
      processInfo.totalRestarts.should.equal(1)
      done()
    }, 1000)
  })
})