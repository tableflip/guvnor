'use strict'

const pem = require('pem-promise')
const loadPlist = require('./lib/load-plist')
const config = require('./config')

const findProcessFingerprint = (context, name) => {
  return loadPlist(name)
  .then(plist => pem.getFingerprint(plist.EnvironmentVariables[`${config.DAEMON_ENV_NAME}_CERT`]))
  .then(result => result.fingerprint)
}

module.exports = findProcessFingerprint
