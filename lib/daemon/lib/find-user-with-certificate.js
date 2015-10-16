var async = require('async')
var fs = require('fs')
var path = require('path')
var pem = require('pem')
var operations = require('../../operations')
var logger = require('winston')

function loadUserCertificate (fingerprint, current, user, callback) {
  if (current) {
    return callback(null, current)
  }

  async.waterfall([
    pem.readPkcs12.bind(null, path.join(user.home, '.config', 'guvnor', user.name + '.p12')),
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
    operations.listUsers,
    function loadEachCertificate (users, next) {
      async.reduce(users, null, loadUserCertificate.bind(null, fingerprint), next)
    }
  ], callback)
}
