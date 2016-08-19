'use strict'

module.exports = function getStatus (server, callback) {
  server.route({
    path: '/',
    method: 'GET',
    handler: function getStatus (request, reply) {
      return request.server.methods.getServerStatus({
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
