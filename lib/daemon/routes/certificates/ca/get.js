'use strict'

const caCertificate = require('../../../lib/ca-certificate')

const getCertificate = (request) => {
  return caCertificate()
}

module.exports = {
  path: '/certificates/ca',
  method: 'GET',
  handler: getCertificate,
  config: {
    auth: {
      strategy: 'certificate',
      scope: ['user']
    }
  }
}
