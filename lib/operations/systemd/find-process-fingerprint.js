'use strict'

const pem = require('pem-promise')
const loadUnitFile = require('./lib/load-unit-file')
const config = require('./config')

const findProcessFingerprint = (context, name) => {
  return loadUnitFile(name)
  .then(unit => pem.getFingerprint(unit.env[`${config.DAEMON_NAME.toUpperCase()}_CERT`]))
  .then(results => results.fingerprint)
}

module.exports = findProcessFingerprint
