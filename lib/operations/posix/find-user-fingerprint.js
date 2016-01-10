var async = require('async')
var path = require('path')
var pem = require('pem')
var posix = require('posix')
var fs = require('fs')
var config = require('../config')

module.exports = function findUserFingerprintPosix (nameOrId, callback) {
  var user

  try {
    user = posix.getpwnam(nameOrId)
  } catch (e) {
    return callback(e)
  }

  async.waterfall([
    fs.readFile.bind(fs, path.join(user.dir, '.config', config.DAEMON_NAME, user.name + '.pub'), 'utf8'),
    function getFingerprint (cert, next) {
      pem.getFingerprint(cert, next)
    }
  ], function loadedFingerprint (error, result) {
    if (error && error.code === 'ENOENT') {
      error = null
    }

    callback(error, result ? result.fingerprint : null)
  })
}
