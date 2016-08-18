'use strict'

const path = require('path')
const pem = require('pem-promise')
const fs = require('fs-promise')
const config = require('../config')
const operations = require('../')

const findUserFingerprintPosix = (nameOrId) => {
  return operations.findUserDetails(nameOrId)
  .then(user => {
    return fs.readFile(path.join(user.dir, '.config', config.DAEMON_NAME, `${user.name}.pub`), 'utf8')
    .then(cert => pem.getFingerprint(cert))
    .then(result => result.fingerprint)
  })
  .catch(error => {
    if (error.code !== 'ENOENT') {
      throw error
    }
  })
}

module.exports = findUserFingerprintPosix
