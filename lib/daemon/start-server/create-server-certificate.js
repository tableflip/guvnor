var pem = require('pem')
var config = require('../config')
var logger = require('winston')

module.exports = function createServerCertificate (ca, callback) {
  logger.debug('Generating SSL certificate for', config.HTTPS_HOST)

  pem.createCertificate({
    serviceKey: ca.key,
    serviceCertificate: ca.certificate,
    serial: Date.now(),
    days: 1024,
    commonName: config.HTTPS_HOST
  }, function (error, result) {
    if (result) {
      result.serviceCertificate = ca.certificate
    }

    callback(error, result)
  })
}
