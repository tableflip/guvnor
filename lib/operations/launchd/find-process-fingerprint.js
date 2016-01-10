var async = require('async')
var pem = require('pem')
var loadPlist = require('./lib/load-plist')
var config = require('./config')

module.exports = function findProcessFingerprint (name, callback) {
  async.waterfall([
    loadPlist.bind(null, name),
    function loadFingerprint (plist, next) {
      pem.getFingerprint(plist.EnvironmentVariables[config.DAEMON_ENV_NAME + '_CERT'], next)
    },
    function loadedFingerprint (results, next) {
      next(null, results.fingerprint)
    }
  ], callback)
}
