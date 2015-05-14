var fs = require('fs')
var async = require('async')
var pem = require('pem')
var logger = require('winston')
var config = require('../config')
var path = require('path')

var caCertPath = path.resolve(path.join(config.CONFIG_DIR, 'ca.crt'))
var caKeyPath = path.resolve(path.join(config.CONFIG_DIR, 'ca.key'))

var ca

module.exports = function loadOrCreateCaCertificate (callback) {
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
  }, function (error, results) {
    if (error && error.code === 'ENOENT') {
      logger.debug('No CA certificate found at %s', caCertPath)
      logger.debug('Generating CA certificate')

      pem.createCertificate({
        days: 4096,
        commonName: 'Guvnor CA Certificate'
      }, function (error, result) {
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
        ], function (error) {
          if (!error) {
            logger.info('Saved CA certificate to %s', caCertPath)
            logger.info('Please import it into your keychain or trust store')
          }

          result.key = result.serviceKey

          ca = result

          callback(error, result)
        })
      })

      return
    }

    logger.debug('CA certificate found at %s', caCertPath)
    logger.debug('CA key found at %s', caKeyPath)

    ca = results

    callback(error, results)
  })
}
