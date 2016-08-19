'use strict'

const fs = require('fs-promise')
const pem = require('pem-promise')
const path = require('path')
const INFO = require('good-enough').INFO
const CONTEXT = 'daemon:lib:read-or-create-certificate'

const generateCertificate = (context, keyFile, certFile, certOpts, keyExtractor) => {
  return pem.createCertificate(certOpts)
  .then((result) => {
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

      return [result.certificate, result.key]
    })
  })
}

const readOrCreateCertificate = (context, keyFile, certFile, certOpts, keyExtractor) => {
  const certificateDirectory = path.dirname(certFile)

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

  return fs.ensureDir(certificateDirectory)
  .then(() => Promise.all([
    fs.readFile(certFile, {
      encoding: 'utf8'
    }),
    fs.readFile(keyFile, {
      encoding: 'utf8'
    })
  ]))
  .then(results => {
    context.log([INFO, CONTEXT], `Certificate found at ${certFile}`)
    context.log([INFO, CONTEXT], `Key found at ${keyFile}`)

    return pem.readCertificateInfo(results[0])
    .then(() => results)
    .catch(() => {
      context.log([INFO, CONTEXT], `Could not read certificate from ${certFile} or key from ${keyFile}`)
      context.log([INFO, CONTEXT], 'Generating new certificate with opts', JSON.stringify(certOpts, null, 2))

      return generateCertificate(context, keyFile, certFile, certOpts, keyExtractor)
    })
  })
  .catch(() => {
    context.log([INFO, CONTEXT], `Could not read certificate from ${certFile} or key from ${keyFile}`)
    context.log([INFO, CONTEXT], 'Generating new certificate with opts', JSON.stringify(certOpts, null, 2))

    return generateCertificate(context, keyFile, certFile, certOpts, keyExtractor)
  })
  .then((results) => {
    return {
      certificate: results[0],
      key: results[1]
    }
  })
}

module.exports = readOrCreateCertificate
