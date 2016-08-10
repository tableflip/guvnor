'use strict'

const async = require('async')
const path = require('path')
const pem = require('pem')
const posix = require('posix')
const fs = require('fs')
const config = require('../config')

module.exports = function findUserFingerprintPosix (nameOrId, callback) {
  let user

  try {
    user = posix.getpwnam(nameOrId)
  } catch (e) {
    return callback(e)
  }

  async.waterfall([
    fs.readFile.bind(fs, path.join(user.dir, '.config', config.DAEMON_NAME, `${user.name}.pub`), 'utf8'),
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
