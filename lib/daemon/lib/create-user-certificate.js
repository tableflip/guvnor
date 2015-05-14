var async = require('async')
var fs = require('fs')
var path = require('path')
var mkdirp = require('mkdirp')
var logger = require('winston')
var createCertificate = require('./create-certificate')
var pem = require('pem')

function createAndSaveCertificate (ca, user, bundleFile, callback) {
  async.waterfall([
    createCertificate.bind(null, ca),
    function writeBundle (results, next) {
      logger.debug('Writing key bundle file')

      fs.writeFile(bundleFile, JSON.stringify({
        key: results.clientKey,
        cert: results.certificate,
        ca: ca.certificate
      }), {
        encoding: 'utf8',
        mode: parseInt('0600', 8)
      }, next)
    },
    function changeOwner (next) {
      fs.chown(bundleFile, user.uid, user.gid, next)
    }
  ], callback)
}

module.exports = function createUserCertificate (ca, user, callback) {
  var certificateDirectory = path.join(user.home, '.config', 'guvnor')
  var bundleFile = path.join(certificateDirectory, user.name + '.keys')

  logger.debug('Checking for key bundle at %s', bundleFile)

  async.waterfall([
    function createDirectory (next) {
      mkdirp(certificateDirectory, parseInt('0700', 8), function (error) {
        next(error)
      })
    },
    function readBundleFile (next) {
      fs.readFile(bundleFile, {
        encoding: 'utf8'
      }, function readBundleFile (error, contents) {
        if (error) {
          if (error.code === 'ENOENT') {
            logger.debug('No key bundle found, generating one')

            return createAndSaveCertificate(ca, user, bundleFile, next)
          }

          return next(error)
        }

        logger.debug('Key bundle for user %s already exists', user.name)
        logger.debug('Checking validity')

        var certs = JSON.parse(contents)

        pem.verifySigningChain(certs.cert, ca.certificate, function (error, valid) {
          if (error) {
            return next(error)
          }

          if (valid) {
            logger.debug('Bundle is valid')
            return next()
          }

          logger.debug('Bundle is invalid, regenerating')
          createAndSaveCertificate(ca, user, bundleFile, next)
        })
      })
    }
  ], callback)
}
