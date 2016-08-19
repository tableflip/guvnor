'use strict'

const fs = require('fs-promise')
const pem = require('pem-promise')
const logger = require('winston')
const path = require('path')

const generateCertificate = (keyFile, certFile, certOpts, keyExtractor) => {
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
      logger.debug(`Saved certificate to ${certFile}`)

      return [result.certificate, result.key]
    })
  })
}

const readOrCreateCertificate = (keyFile, certFile, certOpts, keyExtractor) => {
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
    logger.debug(`Certificate found at ${certFile}`)
    logger.debug(`Key found at ${keyFile}`)

    return pem.readCertificateInfo(results[0])
    .then(() => results)
    .catch(() => {
      logger.debug(`Could not read certificate from ${certFile} or key from ${keyFile}`)
      logger.debug('Generating new certificate with opts', JSON.stringify(certOpts, null, 2))

      return generateCertificate(keyFile, certFile, certOpts, keyExtractor)
    })
  })
  .catch(() => {
    logger.debug(`Could not read certificate from ${certFile} or key from ${keyFile}`)
    logger.debug('Generating new certificate with opts', JSON.stringify(certOpts, null, 2))

    return generateCertificate(keyFile, certFile, certOpts, keyExtractor)
  })
  .then((results) => {
    return {
      certificate: results[0],
      key: results[1]
    }
  })
}

module.exports = readOrCreateCertificate
