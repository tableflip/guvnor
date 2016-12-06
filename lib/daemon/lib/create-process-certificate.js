'use strict'

const pem = require('pem-promise')

module.exports = (csr, ca, callback) => {
  const opts = JSON.parse(JSON.stringify(csr))
  opts.serviceKey = ca.key
  opts.serviceCertificate = ca.certificate
  opts.serial = Date.now()
  opts.days = 4096
  opts.extFile = path.join(__dirname, 'cert-ext.txt')

  return pem.createCertificate(opts)
  .then(result => {
    result.serviceCertificate = ca.certificate

    return result
  })
}
