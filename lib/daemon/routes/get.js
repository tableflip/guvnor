'use strict'

const done = require('../lib/done')

module.exports = function getStatus (server, callback) {
  server.route({
    path: '/',
    method: 'GET',
    handler: function getStatus (request, reply) {
      request.server.methods.getServerStatus({
        user: request.auth.credentials,
        log: request.log.bind(request)
      }, function (error, status) {
        done(reply, error || status)
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
