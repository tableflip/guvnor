'use strict'

const pem = require('pem-promise')
const allPlists = require('./all-plists')
const config = require('../config')

const launchdListProcessCertificateFingerprints = () => {
  const output = {}

  return allPlists()
  .then(plists => plists.filter(plist => plist && plist.EnvironmentVariables && plist.EnvironmentVariables[`${config.DAEMON_ENV_NAME}_CERT`]))
  .then(plists => Promise.all(
    plists.map(
      plist => pem.getFingerprint(plist.EnvironmentVariables[`${config.DAEMON_ENV_NAME}_CERT`])
      .then(fingerprint => {
        output[fingerprint.fingerprint] = {
          name: plist.EnvironmentVariables[`${config.DAEMON_ENV_NAME}_PROCESS_NAME`],
          script: plist.EnvironmentVariables[`${config.DAEMON_ENV_NAME}_SCRIPT`],
          status: 'unknown',
          user: plist.UserName,
          group: plist.GroupName
        }
      })
    )
  ))
}

module.exports = launchdListProcessCertificateFingerprints
