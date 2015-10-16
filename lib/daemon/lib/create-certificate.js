var pem = require('pem')

module.exports = function createCertificate (csr, ca, callback) {
  var opts = JSON.parse(JSON.stringify(csr))
  opts.serviceKey = ca.key
  opts.serviceCertificate = ca.certificate
  opts.serial = Date.now()
  opts.days = 1024

  pem.createCertificate(opts, function (error, result) {
    if (result) {
      result.serviceCertificate = ca.certificate
    }

    callback(error, result)
  })
}
