var async = require('async')
var operations = require('../operations')
var fs = require('fs')
var path = require('path')
var logger = require('winston')
var pem = require('pem')
var config = require('./config')

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
  var keyFile = path.join(user.home, '.config', 'guvnor', user.name + '.key')
  var certFile = path.join(user.home, '.config', 'guvnor', user.name + '.pub')
  var caFile = path.join(config.CONFIG_DIR, 'ca.crt')

  logger.debug('Looking for key at %s', keyFile)
  logger.debug('Looking for cert at %s', certFile)
  logger.debug('Looking for ca at %s', caFile)

  async.parallel({
    key: fs.readFile.bind(fs, keyFile, 'utf8'),
    cert: fs.readFile.bind(fs, certFile, 'utf8'),
    ca: fs.readFile.bind(fs, caFile, 'utf8')
  }, function (error, results) {
    if (error && error.code === 'ENOENT') {
      logger.error('No user certificate was found, please run `sudo guv useradd ' + user.name + '`')
      process.exit(1)
    }

    callback(error, results)
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
    operations.findUserDetails.bind(null, null, process.getuid()),
    function loadedUser (user, next) {
      loadKeyBundle(user, function loadedKeyBundle (error, keyBundle) {
        user.keyBundle = keyBundle
        next(error, user)
      })
    }
  ], callback)
}
