var logger = require('winston')
var done = require('../../../../lib/done')
var Boom = require('boom')

module.exports = function forceProcessGc (server, callback) {
  server.route({
    path: '/processes/{name}/gc',
    method: 'POST',
    handler: function forceProcessGcHandler (request, reply) {
      logger.debug('gc %s', request.params.name)

      request.server.methods.forceGc(request.auth.credentials, request.params.name, function (error) {
        if (error && error.code === 'ENOPROC') {
          error = Boom.notFound('No process found for ' + request.params.name)
        }

        done(reply, error)
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
