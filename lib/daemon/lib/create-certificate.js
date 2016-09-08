'use strict'

const fs = require('fs-promise')
const pem = require('pem-promise')
const INFO = require('good-enough').INFO
const CONTEXT = 'daemon:lib:create-certificate'

const createCertificate = (context, keyFile, certFile, certOpts, keyExtractor) => {
  if (!keyExtractor) {
    keyExtractor = (result) => {
      return {
        key: result.clientKey,
        certificate: result.certificate
      }
    }
  }

  if (typeof keyExtractor !== 'function') {
    throw new Error('keyExtractor was not a function')
  }

  return pem.createCertificate(certOpts)
  .then(result => {
    result = keyExtractor(result)

    if (!result.key || !result.certificate) {
      throw new Error(`keyExtractor should return {key: .., certificate: ..} got object with ${Object.keys(result)}`)
    }

    return Promise.all([
      fs.writeFile(certFile, result.certificate, {
        mode: parseInt('0644', 8)
      }),
      fs.writeFile(keyFile, result.key, {
        mode: parseInt('0600', 8)
      })
    ])
    .then(() => {
      context.log([INFO, CONTEXT], `Saved certificate to ${certFile}`)

      return {
        certificate: result.certificate,
        key: result.key
      }
    })
  })
}

module.exports = createCertificate
