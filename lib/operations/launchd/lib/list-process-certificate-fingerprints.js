var async = require('async')
var pem = require('pem')
var allPlists = require('./all-plists')
var config = require('../config')

module.exports = function launchdListProcessCertificateFingerprints (callback) {
  async.waterfall([
    allPlists,
    function filterProcessesWithoutCertificates (plists, next) {
      next(null, plists.filter(function plistFilter (plist) {
        return plist && plist.EnvironmentVariables && plist.EnvironmentVariables[config.DAEMON_ENV_NAME + '_CERT']
      }))
    },
    function findCertificateFingerprints (plists, next) {
      var output = {}

      async.map(plists, function getFingerprint (plist, done) {
        pem.getFingerprint(plist.EnvironmentVariables[config.DAEMON_ENV_NAME + '_CERT'], function gotFingerprint (error, fingerprint) {
          if (!error) {
            output[fingerprint.fingerprint] = {
              name: plist.EnvironmentVariables[config.DAEMON_ENV_NAME + '_PROCESS_NAME'],
              script: plist.EnvironmentVariables[config.DAEMON_ENV_NAME + '_SCRIPT'],
              status: 'unknown',
              user: plist.UserName,
              group: plist.GroupName
            }
          }

          done(error)
        })
      }, function foundCertificateFingerprints (error) {
        next(error, output)
      })
    }
  ], callback)
}
