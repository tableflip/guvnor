'use strict'

const done = require('../../lib/done')

module.exports = function getUsers (server, callback) {
  server.route({
    path: '/users',
    method: 'GET',
    handler: function getUsersHandler (request, reply) {
      request.server.methods.listUsers({
        user: request.auth.credentials,
        log: request.log.bind(request)
      }, function (error, users) {
        done(reply, error || users)
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
