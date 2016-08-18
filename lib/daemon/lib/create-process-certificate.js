'use strict'

const pem = require('pem-promise')

module.exports = (csr, ca, callback) => {
  const opts = JSON.parse(JSON.stringify(csr))
  opts.serviceKey = ca.key
  opts.serviceCertificate = ca.certificate
  opts.serial = Date.now()
  opts.days = 1024

  return pem.createCertificate(opts)
  .then(result => {
    result.serviceCertificate = ca.certificate

    return result
  })
}
