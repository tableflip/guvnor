var Joi = require('joi')
var done = require('../../../lib/done')
var logger = require('winston')
var Boom = require('boom')
var processStatistics = require('../../../lib/process-statistics')

module.exports = function removeProcess (server, callback) {
  server.route({
    path: '/processes/{name}',
    method: 'DELETE',
    handler: function removeProcessHandler (request, reply) {
      logger.debug('Removing process %s', request.params.name)

      request.server.methods.removeProcess(request.auth.credentials, request.params.name, function (error) {
        if (error && error.code === 'ENOENT') {
          return reply(Boom.notFound())
        }

        processStatistics.remove(request.auth.credentials, request.params.name)

        done(reply, error)
      })
    },
    config: {
      auth: {
        strategy: 'certificate',
        scope: ['user']
      },
      validate: {
        params: {
          name: Joi.string().required()
        }
      }
    }
  })

  callback()
}
