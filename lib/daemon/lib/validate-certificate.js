'use strict'

const pem = require('pem-promise')
const INFO = require('good-enough').INFO
const CONTEXT = 'daemon:lib:verify-certificate'

const validateCertificate = (context, certificate, ca) => {
  return pem.verifySigningChain(certificate, ca)
  .then(valid => {
    if (!valid) {
      const error = new Error('Certificate was invalid')
      error.code = 'EINVALIDCERTIFICATE'

      throw error
    }

    context.log([INFO, CONTEXT], 'Certificate is valid')
  })
}

module.exports = validateCertificate
