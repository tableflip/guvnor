'use strict'

const fs = require('fs-promise')
const path = require('path')
const logger = require('winston')
const pem = require('pem-promise')
const config = require('../config')
const readOrCreateCertificate = require('./read-or-create-certificate')

module.exports = (ca, user, callback) => {
  const certificateDirectory = path.join(user.home, '.config', config.DAEMON_NAME)
  const keyFile = path.join(certificateDirectory, `${user.name}.key`)
  const certificateFile = path.join(certificateDirectory, `${user.name}.pub`)

  logger.info(`Checking for certificate at ${certificateFile}`)

  const certificateOpts = {
    commonName: user.name,
    organization: config.DAEMON_NAME,
    organizationUnit: 'user',
    serviceKey: ca.key,
    serviceCertificate: ca.certificate,
    serial: Date.now(),
    days: 1024
  }

  readOrCreateCertificate(keyFile, certificateFile, certificateOpts)
  .then(results => {
    logger.info('Certificate and key for user %s already exists', user.name)
    logger.info('Checking validity for user', user.name)

    pem.verifySigningChain(results.certificate, ca.certificate)
    .then(valid => {
      if (valid) {
        logger.info('%s\'s certificate is valid', user.name)
        return results
      }

      logger.info('%\'s certificate is invalid, regenerating', user.name)

      return Promise.all([
        fs.unlink(certificateFile),
        fs.unlink(keyFile)
      ])
      .then(() => readOrCreateCertificate(keyFile, certificateFile, certificateOpts))
    })
  })
}
