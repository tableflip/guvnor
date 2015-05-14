var describe = require('mocha').describe
var it = require('mocha').it
var beforeEach = require('mocha').beforeEach
var afterEach = require('mocha').afterEach
var proxyquire = require('proxyquire')
var sinon = require('sinon')
var expect = require('chai').expect

describe('cli/load-certificate', function () {
  var loadCertificate
  var fs
  var exit

  beforeEach(function () {
    exit = process.exit
    process.exit = sinon.stub()

    fs = {
      readFile: sinon.stub()
    }

    loadCertificate = proxyquire('../../../../lib/cli/load-certificate', {
      'fs': fs
    })
  })

  afterEach(function () {
    process.exit = exit
  })

  it('should load a user certificate', function (done) {
    fs.readFile.withArgs('/home/alex/.config/guvnor/alex.keys').callsArgWithAsync(2, null, '{"foo": "bar"}')

    loadCertificate({
      name: 'alex',
      home: '/home/alex'
    }, function (error, result) {
      expect(error).to.not.exist
      expect(result.foo).to.equal('bar')
      done()
    })
  })

  it('should exit if no certificate is present', function (done) {
    var error = new Error('Urk!')
    error.code = 'ENOENT'

    fs.readFile.withArgs('/home/alex/.config/guvnor/alex.keys').callsArgWithAsync(2, error)

    loadCertificate({
      name: 'alex',
      home: '/home/alex'
    }, function (err, result) {
      expect(err).to.equal(error)
      expect(process.exit.calledWith(1)).to.be.true

      done()
    })
  })

  it('should pass back any other errors', function (done) {
    var error = new Error('Urk!')

    fs.readFile.withArgs('/home/alex/.config/guvnor/alex.keys').callsArgWithAsync(2, error)

    loadCertificate({
      name: 'alex',
      home: '/home/alex'
    }, function (err, result) {
      expect(err).to.equal(error)
      expect(process.exit.calledWith(1)).to.be.false

      done()
    })
  })
})
