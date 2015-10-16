var async = require('async')
var path = require('path')
var pem = require('pem')

module.exports = function findUserFingerprint (user, callback) {
  async.waterfall([
    pem.readPkcs12.bind(null, path.join(user.home, '.config', 'guvnor', user.name + '.p12')),
    function getFingerprint (keys, next) {
      pem.getFingerprint(keys.cert, next)
    }
  ], function loadedFingerprint (error, result) {
    if (error && error.code === 'ENOENT') {
      error = null
    }

    callback(error, result ? result.fingerprint : null)
  })
}
