var describe = require('mocha').describe
var beforeEach = require('mocha').beforeEach
var it = require('mocha').it
var sinon = require('sinon')
var expect = require('chai').expect
var proxyquire = require('proxyquire')

describe('operations/launchd/is-process-running', function () {
  var allProcesses
  var isProcessRunning

  beforeEach(function () {
    allProcesses = sinon.stub()
    isProcessRunning = proxyquire('../../../../../lib/operations/launchd/is-process-running', {
      './all-processes': allProcesses
    })
  })

  it('should recognise if process is running', function (done) {
    var name = 'com.apple.AirPlayUIAgent'

    allProcesses.callsArgWithAsync(0, null, [{
      name: name,
      pid: 5
    }])

    isProcessRunning(name, function (error, isRunning) {
      expect(error).to.not.exist
      expect(isRunning).to.be.true
      done()
    })
  })
})
