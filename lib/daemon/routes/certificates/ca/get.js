'use strict'

const caCertificate = require('../../../lib/ca-certificate')

const getCertificate = (request, reply) => {
  return caCertificate()
  .then(ca => {
    reply(ca.certificate)
      .type('text/plain')
  })
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
