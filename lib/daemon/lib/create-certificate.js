'use strict'

const pem = require('pem')

module.exports = (csr, ca, callback) => {
  const opts = JSON.parse(JSON.stringify(csr))
  opts.serviceKey = ca.key
  opts.serviceCertificate = ca.certificate
  opts.serial = Date.now()
  opts.days = 1024

  pem.createCertificate(opts, (error, result) => {
    if (result) {
      result.serviceCertificate = ca.certificate
    }

    callback(error, result)
  })
}
