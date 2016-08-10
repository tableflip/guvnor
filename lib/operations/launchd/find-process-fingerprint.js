'use strict'

const async = require('async')
const pem = require('pem')
const loadPlist = require('./lib/load-plist')
const config = require('./config')

module.exports = function findProcessFingerprint (name, callback) {
  async.waterfall([
    loadPlist.bind(null, name),
    function loadFingerprint (plist, next) {
      pem.getFingerprint(plist.Environmentconstiables[`${config.DAEMON_ENV_NAME}_CERT`], next)
    },
    function loadedFingerprint (results, next) {
      next(null, results.fingerprint)
    }
  ], (error, results) => {
    callback(error, error ? undefined : results)
  })
}
