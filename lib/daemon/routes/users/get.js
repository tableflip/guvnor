'use strict'

module.exports = function getUsers (server, callback) {
  server.route({
    path: '/users',
    method: 'GET',
    handler: function getUsersHandler (request, reply) {
      return request.server.methods.listUsers({
        user: request.auth.credentials,
        log: request.log.bind(request)
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
