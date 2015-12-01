var async = require('async')
var pem = require('pem')
var loadPlist = require('./lib/load-plist')

module.exports = function findProcessFingerprint (name, callback) {
  async.waterfall([
    loadPlist.bind(null, name),
    function loadFingerprint (plist, next) {
      pem.getFingerprint(plist.EnvironmentVariables.GUVNOR_CERT, next)
    },
    function loadedFingerprint (results, next) {
      next(null, results.fingerprint)
    }
  ], callback)
}
