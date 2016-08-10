'use strict'

const Boom = require('boom')

module.exports = function forceProcessGc (server, callback) {
  server.route({
    path: '/processes/{name}/gc',
    method: 'POST',
    handler: function forceProcessGcHandler (request, reply) {
      request.server.methods.forceGc({
        user: request.auth.credentials,
        log: request.log.bind(request)
      }, request.params.name, function (error) {
        if (error && error.code === 'ENOPROC') {
          error = Boom.notFound(`No process found for ${request.params.name}`)
        }

        reply(error)
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
