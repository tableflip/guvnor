'use strict'

const config = require('../config')
const path = require('path')
const readOrCreateCertificate = require('./read-or-create-certificate')

const CA_CERT_DAYS = 4096
const CA_CERT_PATH = path.resolve(path.join(config.CONFIG_DIR, 'ca.crt'))
const CA_KEY_PATH = path.resolve(path.join(config.CONFIG_DIR, 'ca.key'))

module.exports = readOrCreateCertificate(CA_KEY_PATH, CA_CERT_PATH, {
  days: CA_CERT_DAYS,
  commonName: `${config.DAEMON_NAME} CA Certificate`
}, (result) => {
  return {
    certificate: result.certificate,
    key: result.serviceKey
  }
})
