var describe = require('mocha').describe
var beforeEach = require('mocha').beforeEach
var it = require('mocha').it
var sinon = require('sinon')
var expect = require('chai').expect
var proxyquire = require('proxyquire')

describe('process-operations', function () {
  var processOperations
  var createProcess

  beforeEach(function () {
    createProcess = sinon.stub()

    var os = {
      platform: sinon.stub().returns('darwin')
    }

    processOperations = proxyquire('../../../../lib/process-operations', {
      './launchd/create-process': createProcess,
      'os': os
    })
  })

  it('should expose api methods', function () {
    expect(processOperations.createProcess).to.be.a('function')
  })

  it('should validate call arguments', function (done) {
    processOperations.createProcess(function (error) {
      expect(error).to.exist
      expect(error.toString()).to.contain('authentication credentials" must be an object')

      done()
    })
  })

  it('should validate response arguments', function (done) {
    createProcess.callsArgWithAsync(2, 'foo')

    processOperations.createProcess({
      uid: 5,
      gid: 5,
      name: 'name',
      home: 'home',
      group: 'group',
      groups: [],
      scope: 'user'
    }, {
      script: 'script'
    }, function (error) {
      expect(error).to.exist
      expect(error.toString()).to.contain('ValidationError')
      expect(error.toString()).to.contain('must be an object')

      done()
    })
  })
})
