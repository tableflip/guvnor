var async = require('async')
var fs = require('fs')
var path = require('path')
var mkdirp = require('mkdirp')
var logger = require('winston')
var createCertificate = require('./create-certificate')
var pem = require('pem')

function createAndSaveCertificate (ca, user, keyFile, certificateFile, callback) {
  var certs

  // generate an SSL certificate signed by our CA and write the public certificate and key out
  async.auto({
    generateCertificate: function (done) {
        createCertificate({
        commonName: user.name,
        organization: 'guvnor',
        organizationUnit: 'user'
      }, ca, done)
    },
    createKey: ['generateCertificate', function (next, results) {
      logger.debug('Writing key file for', user.name)

      async.series([
        function writeKeyFile (done) {
          fs.writeFile(keyFile, results.generateCertificate.clientKey, {
            encoding: 'utf8',
            mode: parseInt('0600', 8)
          }, done)
        },
        function chownKeyFile (done) {
          fs.chown(keyFile, user.uid, user.gid, done)
        }
      ], next)
    }],
    createCertificate: ['generateCertificate', function (next, results) {
      logger.debug('Writing certificate file for', user.name)

      async.series([
        function writeCertificateFile (done) {
          fs.writeFile(certificateFile, results.generateCertificate.certificate, {
            encoding: 'utf8',
            mode: parseInt('0644', 8)
          }, done)
        },
        function chownCertificateFile (done) {
          fs.chown(certificateFile, user.uid, user.gid, done)
        }
      ], next)
    }]
  }, function (error, results) {
    callback(error, error ? null : results.generateCertificate.certificate)
  })
}

module.exports = function createUserCertificate (ca, user, callback) {
  var certificateDirectory = path.join(user.home, '.config', 'guvnor')
  var keyFile = path.join(certificateDirectory, user.name + '.key')
  var certificateFile = path.join(certificateDirectory, user.name + '.pub')

  logger.debug('Checking for certificate at %s', certificateFile)

  async.series([
    function createDirectory (next) {
      logger.debug('Creating %s', certificateDirectory)
      mkdirp(certificateDirectory, parseInt('0700', 8), function (error) {
        next(error)
      })
    },
    function changeConfigOwner (next) {
      fs.chown(path.join(user.home, '.config'), user.uid, user.gid, next)
    },
    function changeConfigGuvnorOwner (next) {
      fs.chown(path.join(user.home, '.config', 'guvnor'), user.uid, user.gid, next)
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
