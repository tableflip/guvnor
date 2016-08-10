'use strict'

const async = require('async')
const pem = require('pem')
const allPlists = require('./all-plists')
const config = require('../config')

module.exports = function launchdListProcessCertificateFingerprints (callback) {
  async.waterfall([
    allPlists,
    function filterProcessesWithoutCertificates (plists, next) {
      next(null, plists.filter(function plistFilter (plist) {
        return plist && plist.Environmentconstiables && plist.Environmentconstiables[`${config.DAEMON_ENV_NAME}_CERT`]
      }))
    },
    function findCertificateFingerprints (plists, next) {
      const output = {}

      async.map(plists, function getFingerprint (plist, done) {
        pem.getFingerprint(plist.Environmentconstiables[`${config.DAEMON_ENV_NAME}_CERT`], function gotFingerprint (error, fingerprint) {
          if (!error) {
            output[fingerprint.fingerprint] = {
              name: plist.Environmentconstiables[`${config.DAEMON_ENV_NAME}_PROCESS_NAME`],
              script: plist.Environmentconstiables[`${config.DAEMON_ENV_NAME}_SCRIPT`],
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
