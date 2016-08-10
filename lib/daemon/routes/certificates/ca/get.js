'use strict'

const caCertificate = require('../../../lib/ca-certificate')

module.exports = function getCertificate (server, callback) {
  server.route({
    path: '/certificates/ca',
    method: 'GET',
    handler: function getCertificateHandler (request, reply) {
      caCertificate(function loadedCertificate (error, result) {
        reply(error, result ? result.certificate : null)
          .type('text/plain')
      })
    },
    config: {
      auth: {
        strategy: 'certificate',
        scope: ['user']
      }
    }
  })

  callback()
}
