'use strict'

const caCertificate = require('../lib/ca-certificate')

module.exports = function loadOrCreateCaCertificate (_, callback) {
  caCertificate(callback)
}
