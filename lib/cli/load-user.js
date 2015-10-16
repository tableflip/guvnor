var async = require('async')
var platformOperations = require('../platform-operations')
var fs = require('fs')
var path = require('path')
var logger = require('winston')
var pem = require('pem')

function loadKeyBundleFromEnv () {
  if (process.env.GUVNOR_USER_CERT && process.env.GUVNOR_USER_KEY && process.env.GUVNOR_CA) {
    logger.debug('Returning key bundle from environment')

    return {
      cert: process.env.GUVNOR_USER_CERT,
      key: process.env.GUVNOR_USER_KEY,
      ca: process.env.GUVNOR_CA
    }
  }
}

function loadKeyBundleFromFile (user, callback) {
  var bundleFile = path.join(user.home, '.config', 'guvnor', user.name + '.p12')
  logger.debug('Looking for key bundle at %s', bundleFile)

  pem.readPkcs12(bundleFile, function (error, keyBundle) {
    if (error && error.code === 'ENOENT') {
      logger.error('No user certificate was found, please run `sudo guv useradd ' + user.name + '`')
      process.exit(1)
    }

    keyBundle.ca = keyBundle.ca.pop()

    callback(error, keyBundle)
  })
}

function loadKeyBundle (user, callback) {
  var keyBundle = loadKeyBundleFromEnv()

  if (keyBundle) {
    return callback(null, keyBundle)
  }

  return loadKeyBundleFromFile(user, callback)
}

module.exports = function loadUser (callback) {
  async.waterfall([
    platformOperations.findUserDetails.bind(null, process.getuid()),
    function loadedUser (user, next) {
      loadKeyBundle(user, function loadedKeyBundle (error, keyBundle) {
        user.keyBundle = keyBundle
        next(error, user)
      })
    }
  ], callback)
}
