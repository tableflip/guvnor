var describe = require('mocha').describe
var beforeEach = require('mocha').beforeEach
var it = require('mocha').it
var sinon = require('sinon')
var expect = require('chai').expect
var proxyquire = require('proxyquire')

describe('operations/launchd/list-process-certificate-fingerprints', function () {
  var listProcessCertificates
  var allPlists
  var pem

  beforeEach(function () {
    allPlists = sinon.stub()
    pem = {
      getFingerprint: sinon.stub()
    }

    listProcessCertificates = proxyquire('../../../../../lib/operations/launchd/list-process-certificate-fingerprints', {
      './all-plists': allPlists,
      'pem': pem
    })
  })

  it('should read files and extract certificate fingerprints', function (done) {
    var plists = [{
      Label: 'with-cert-label',
      EnvironmentVariables: {
        GUVNOR_PROCESS_NAME: 'with-cert-label',
        GUVNOR_CERT: 'with-cert-cert'
      }
    }, {
      Label: 'without-cert-label',
      EnvironmentVariables: {

      }
    }]

    allPlists.callsArgWithAsync(0, null, plists)

    pem.getFingerprint.withArgs('with-cert-cert').callsArgWithAsync(1, null, {
      fingerprint: 'fingerprint'
    })

    listProcessCertificates(function (error, result) {
      expect(error).to.not.exist
      expect(Object.keys(result).length).to.equal(1)

      expect(result['fingerprint'].name).to.equal('with-cert-label')

      done()
    })
  })
})
