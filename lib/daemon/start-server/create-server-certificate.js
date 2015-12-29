var pem = require('pem')
var config = require('../config')
var logger = require('winston')
var os = require('os')

module.exports = function createServerCertificate (ca, callback) {
  logger.debug('Generating SSL certificate for', config.HTTPS_HOST)

  var altNames = [
    config.HTTPS_HOST,
    os.hostname(),
    'localhost'
  ]
  var interfaces = os.networkInterfaces()

  Object.keys(interfaces).forEach(function (type) {
    interfaces[type].forEach(function (networkInterface) {
      altNames.push(networkInterface.address)
    })
  })

  pem.createCertificate({
    serviceKey: ca.key,
    serviceCertificate: ca.certificate,
    serial: Date.now(),
    days: 1024,
    commonName: config.HTTPS_HOST,
    altNames: altNames
  }, function (error, result) {
    if (result) {
      result.serviceCertificate = ca.certificate
    }

    callback(error, result)
  })
}
