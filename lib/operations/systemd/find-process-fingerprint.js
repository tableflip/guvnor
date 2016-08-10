'use strict'

const async = require('async')
const pem = require('pem')
const loadUnitFile = require('./lib/load-unit-file')
const config = require('./config')

module.exports = function findProcessFingerprint (name, callback) {
  async.waterfall([
    loadUnitFile.bind(null, name),
    function loadFingerprint (unit, next) {
      pem.getFingerprint(unit.env[`${config.DAEMON_NAME.toUpperCase()}_CERT`], next)
    },
    function loadedFingerprint (results, next) {
      next(null, results.fingerprint)
    }
  ], (error, results) => {
    callback(error, error ? undefined : results)
  })
}
