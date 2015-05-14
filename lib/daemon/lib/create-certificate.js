var pem = require('pem')

module.exports = function createCertificate (ca, callback) {
  pem.createCertificate({
    serviceKey: ca.key,
    serviceCertificate: ca.certificate,
    serial: Date.now(),
    days: 1024
  }, function (error, result) {
    if (result) {
      result.serviceCertificate = ca.certificate
    }

    callback(error, result)
  })
}
