'use strict'

const fs = require('fs-promise')
const pem = require('pem-promise')
const logger = require('winston')
const path = require('path')

const readOrCreateCertificate = (keyFile, certFile, certOpts, keyExtractor) => {
  const certificateDirectory = path.dirname(certFile)
  // , parseInt('0700', 8)
  return fs.ensureDir(certificateDirectory)
  .then(() => Promise.all([
    fs.readFile(certFile, {
      encoding: 'utf8'
    }),
    fs.readFile(keyFile, {
      encoding: 'utf8'
    })
  ]))
  .then((results) => {
    logger.debug(`Certificate found at ${certFile}`)
    logger.debug(`Key found at ${keyFile}`)

    return results
  })
  .catch(() => {
    logger.debug(`Could not read certificate from ${certFile} or key from ${keyFile}`)
    logger.debug('Generating new certificate')

    return pem.createCertificate(certOpts)
    .then((result) => {
      result = keyExtractor(result)

      return Promise.all([
        fs.writeFile(certFile, result.certificate, {
          mode: parseInt('0644', 8)
        }),
        fs.writeFile(keyFile, result.key, {
          mode: parseInt('0600', 8)
        })
      ])
      .then(() => {
        logger.info(`Saved certificate to ${certFile}`)

        return [result.certificate, result.key]
      })
    })
  })
  .then((results) => {
    return {
      certificate: results[0],
      key: results[1]
    }
  })
}

module.exports = readOrCreateCertificate
