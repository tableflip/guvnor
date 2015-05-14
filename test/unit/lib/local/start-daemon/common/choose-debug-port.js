var describe = require('mocha').describe
var it = require('mocha').it
var beforeEach = require('mocha').beforeEach
var expect = require('chai').expect
var sinon = require('sinon')
var proxyquire = require('proxyquire')

describe('lib/local/start-daemon/common/choose-debug-port', function () {
  var chooseDebugPort
  var freePortStub

  beforeEach(function () {
    freePortStub = sinon.stub()
    chooseDebugPort = proxyquire('../../../../../../lib/local/start-daemon/common/choose-debug-port', {
      'freeport': freePortStub
    })
  })

  it('should choose a random port', function (done) {
    var port = 5
    freePortStub.callsArgWithAsync(0, null, port)

    chooseDebugPort({
      debug: {
        daemon: true
      }
    }, function (error, options) {
      expect(error).to.not.exist
      expect(options.debug.daemon).to.equal(5)

      done()
    })
  })

  it('should propagate error choosing a random port', function (done) {
    var error = new Error('Urk!')
    freePortStub.callsArgWithAsync(0, error)

    chooseDebugPort({
      debug: {
        daemon: true
      }
    }, function (err) {
      expect(err).to.equal(error)

      done()
    })
  })

  it('should respect specified port and set debug flag', function (done) {
    var port = 5

    chooseDebugPort({
      debug: {
        daemon: port
      }
    }, function (error, options) {
      expect(error).to.not.exist
      expect(options.debug.daemon).to.equal(port)

      done()
    })
  })
})
