var async = require('async')
var pem = require('pem')
var loadUnitFile = require('./lib/load-unit-file')
var config = require('./config')

module.exports = function findProcessFingerprint (name, callback) {
  async.waterfall([
    loadUnitFile.bind(null, name),
    function loadFingerprint (unit, next) {
      pem.getFingerprint(unit.env[config.DAEMON_NAME.toUpperCase() + '_CERT'], next)
    },
    function loadedFingerprint (results, next) {
      next(null, results.fingerprint)
    }
  ], callback)
}
