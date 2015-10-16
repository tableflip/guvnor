var describe = require('mocha').describe
var it = require('mocha').it
var expect = require('chai').expect
var pem = require('pem')
var certReader = require('../../../../lib/common/cert-reader')

describe('common/cert-reader', function () {

  it('should read a cert', function (done) {
    pem.createCertificate(function (error, result) {
      expect(error).to.not.exist

      var cert = result.certificate.replace(/\n/g, '')

      var read = certReader('-----BEGIN CERTIFICATE-----', '-----END CERTIFICATE-----', cert)

      expect(read).to.equal(result.certificate)

      done()
    })
  })
})
