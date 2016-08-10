'use strict'

const fs = require('fs')
const async = require('async')
const pem = require('pem')
const logger = require('winston')
const config = require('../config')
const path = require('path')

const caCertPath = path.resolve(path.join(config.CONFIG_DIR, 'ca.crt'))
const caKeyPath = path.resolve(path.join(config.CONFIG_DIR, 'ca.key'))

let ca

module.exports = (callback) => {
  if (ca) {
    return callback(null, ca)
  }

  async.parallel({
    certificate: fs.readFile.bind(fs, caCertPath, {
      encoding: 'utf8'
    }),
    key: fs.readFile.bind(fs, caKeyPath, {
      encoding: 'utf8'
    })
  }, (error, results) => {
    if (error && error.code === 'ENOENT') {
      logger.debug(`No CA certificate found at ${caCertPath}`)
      logger.debug('Generating CA certificate')

      pem.createCertificate({
        days: 4096,
        commonName: `${config.DAEMON_NAME} CA Certificate`
      }, (error, result) => {
        if (error) {
          return callback(error)
        }

        logger.debug('Generated CA certificate')

        async.parallel([
          fs.writeFile.bind(fs, caCertPath, result.certificate, {
            mode: parseInt('0644', 8)
          }),
          fs.writeFile.bind(fs, caKeyPath, result.serviceKey, {
            mode: parseInt('0600', 8)
          })
        ], (error) => {
          if (!error) {
            logger.info(`Saved CA certificate to ${caCertPath}`)
            logger.info('Please import it into your keychain or trust store')
          }

          result.key = result.serviceKey

          ca = result

          callback(error, result)
        })
      })

      return
    }

    logger.debug(`CA certificate found at ${caCertPath}`)
    logger.debug(`CA key found at ${caKeyPath}`)

    ca = results

    callback(error, results)
  })
}
