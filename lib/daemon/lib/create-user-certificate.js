'use strict'

const async = require('async')
const fs = require('fs')
const path = require('path')
const mkdirp = require('mkdirp')
const logger = require('winston')
const createCertificate = require('./create-certificate')
const pem = require('pem')
const config = require('../config')

const createAndSaveCertificate = (ca, user, keyFile, certificateFile, callback) => {
  // generate an SSL certificate signed by our CA and write the public certificate and key out
  async.auto({
    generateCertificate: (done) => {
      createCertificate({
        commonName: user.name,
        organization: config.DAEMON_NAME,
        organizationUnit: 'user'
      }, ca, done)
    },
    createKey: ['generateCertificate', (results, next) => {
      logger.debug(`Writing key file for ${user.name}`)

      async.series([
        (done) => {
          fs.writeFile(keyFile, results.generateCertificate.clientKey, {
            encoding: 'utf8',
            mode: parseInt('0600', 8)
          }, done)
        },
        (done) => {
          fs.chown(keyFile, user.uid, user.gid, done)
        }
      ], next)
    }],
    createCertificate: ['generateCertificate', (results, next) => {
      logger.debug(`Writing certificate file for ${user.name}`)

      async.series([
        (done) => {
          fs.writeFile(certificateFile, results.generateCertificate.certificate, {
            encoding: 'utf8',
            mode: parseInt('0644', 8)
          }, done)
        },
        (done) => {
          fs.chown(certificateFile, user.uid, user.gid, done)
        }
      ], next)
    }]
  }, (error, results) => {
    callback(error, error ? null : results.generateCertificate.certificate)
  })
}

module.exports = (ca, user, callback) => {
  const certificateDirectory = path.join(user.home, '.config', config.DAEMON_NAME)
  const keyFile = path.join(certificateDirectory, `${user.name}.key`)
  const certificateFile = path.join(certificateDirectory, `${user.name}.pub`)

  logger.debug(`Checking for certificate at ${certificateFile}`)

  async.series([
    (next) => {
      logger.debug(`Creating ${certificateDirectory}`)
      mkdirp(certificateDirectory, parseInt('0700', 8), function (error) {
        next(error)
      })
    },
    function changeConfigDirectoryOwner (next) {
      fs.chown(path.join(user.home, '.config'), user.uid, user.gid, next)
    },
    function changeDaemonConfigDirectoryOwner (next) {
      fs.chown(path.join(user.home, '.config', config.DAEMON_NAME), user.uid, user.gid, next)
    },
    function readCertificateFile (next) {
      async.parallel({
        certificate: fs.readFile.bind(fs, certificateFile, 'utf8'),
        key: fs.readFile.bind(fs, keyFile, 'utf8')
      }, function (error, results) {
        if (error) {
          if (error.code === 'ENOENT') {
            logger.debug('No certificate or key found, generating them')

            return createAndSaveCertificate(ca, user, keyFile, certificateFile, next)
          }

          return next(error)
        }

        logger.debug('Certificate and key for user %s already exists', user.name)
        logger.debug('Checking validity for user', user.name)

        pem.verifySigningChain(results.certificate, ca.certificate, function (error, valid) {
          if (error) {
            return next(error)
          }

          if (valid) {
            logger.debug('%s\'s certificate is valid', user.name)
            return next(null, results.certificate)
          }

          logger.debug('%\'s certificate is invalid, regenerating', user.name)
          createAndSaveCertificate(ca, user, keyFile, certificateFile, next)
        })
      })
    }
  ], callback)
}
