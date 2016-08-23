'use strict'

const caCertificate = require('../../../lib/ca-certificate')
const context = require('../../../lib/context')

const getCertificate = (request) => {
  return caCertificate(context(request))
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
