var async = require('async')
var fs = require('fs')
var path = require('path')
var mkdirp = require('mkdirp')
var logger = require('winston')
var createCertificate = require('./create-certificate')
var pem = require('pem')

function createAndSaveCertificate (ca, user, bundleFile, callback) {
  var certs

  async.waterfall([
    createCertificate.bind(null, {
      commonName: user.name,
      organization: 'guvnor',
      organizationUnit: 'user'
    }, ca),
    function writeBundle (results, next) {
      logger.debug('Writing key bundle file')

      certs = {
        key: results.clientKey,
        cert: results.certificate,
        ca: ca.certificate
      }

      pem.createPkcs12(results.clientKey, results.certificate, '', {
        certFiles: [
          ca.certificate
        ]
      }, function (error, result) {
        if (error) {
          return next(error)
        }

        fs.writeFile(bundleFile, result.pkcs12, {
          mode: parseInt('0600', 8)
        }, next)
      })
    },
    function changeOwner (next) {
      fs.chown(bundleFile, user.uid, user.gid, next)
    }
  ], function (error) {
    callback(error, certs)
  })
}

module.exports = function createUserCertificate (ca, user, callback) {
  var certificateDirectory = path.join(user.home, '.config', 'guvnor')
  var bundleFile = path.join(certificateDirectory, user.name + '.p12')

  logger.debug('Checking for key bundle at %s', bundleFile)

  async.waterfall([
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
    function readBundleFile (next) {
      async.waterfall([
        fs.readFile.bind(fs, bundleFile),
        pem.readPkcs12
      ], function (error, results) {
        if (error) {
          if (error.code === 'ENOENT') {
            logger.debug('No key bundle found, generating one')

            return createAndSaveCertificate(ca, user, bundleFile, next)
          }

          return next(error)
        }

        logger.debug('Key bundle for user %s already exists', user.name)

        var certs = {
          key: results.key,
          cert: results.cert,
          ca: results.ca[0]
        }

        logger.debug('Checking validity')

        pem.verifySigningChain(certs.cert, ca.certificate, function (error, valid) {
          if (error) {
            return next(error)
          }

          if (valid) {
            logger.debug('Bundle is valid')
            return next(null, certs)
          }

          logger.debug('Bundle is invalid, regenerating')
          createAndSaveCertificate(ca, user, bundleFile, next)
        })
      })
    }
  ], callback)
}
