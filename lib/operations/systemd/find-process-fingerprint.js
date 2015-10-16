var async = require('async')
var pem = require('pem')
var loadUnitFile = require('./load-unit-file')

module.exports = function findProcessFingerprint (name, callback) {
  async.waterfall([
    loadUnitFile.bind(null, name),
    function loadFingerprint (unit, next) {
      pem.getFingerprint(unit.env.GUVNOR_CERT, next)
    },
    function loadedFingerprint (results, next) {
      next(null, results.fingerprint)
    }
  ], callback)
}
