var async = require('async')
var path = require('path')
var pem = require('pem')
var posix = require('posix')

module.exports = function findUserFingerprint (nameOrId, callback) {
  var user

  try {
    user = posix.getpwnam(nameOrId)
  } catch (e) {
    return callback(e)
  }

  async.waterfall([
    pem.readPkcs12.bind(null, path.join(user.dir, '.config', 'guvnor', user.name + '.p12')),
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
