'use strict'

const async = require('async')
const path = require('path')
const pem = require('pem')
const operations = require('../../operations')
const config = require('../config')

function loadUserCertificate (fingerprint, current, user, callback) {
  if (current) {
    return callback(null, current)
  }

  async.waterfall([
    pem.readPkcs12.bind(null, path.join(user.home, '.config', config.DAEMON_NAME, `${user.name}.p12`)),
    function getFingerprint (keys, next) {
      pem.getFingerprint(keys.cert, next)
    },
    function gotFingerprint (result, next) {
      next(null, result.fingerprint)
    }
  ], function loadedFingerprint (error, loadedFingerprint) {
    if (error && error.code === 'ENOENT') {
      error = null
    }

    user.scope = 'user'

    if (user.name === 'root') {
      user.scope = 'admin'
    }

    callback(null, fingerprint === loadedFingerprint ? user : null)
  })
}

module.exports = function (fingerprint, callback) {
  async.waterfall([
    operations.listUsers.bind(null, null),
    function loadEachCertificate (users, next) {
      async.reduce(users, null, loadUserCertificate.bind(null, fingerprint), next)
    }
  ], callback)
}
