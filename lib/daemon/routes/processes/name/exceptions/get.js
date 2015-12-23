var Joi = require('joi')
var Boom = require('boom')
var processStatistics = require('../../../../lib/process-statistics')

module.exports = function getExceptions (server, callback) {
  server.route({
    path: '/processes/{name}/exceptions',
    method: 'GET',
    handler: function getExceptionsHandler (request, reply) {
      processStatistics(request.auth.credentials, request.params.name, function (error, proc) {
        if (error) {
          return reply(Boom.wrap(error))
        }

        if (!proc) {
          return reply(Boom.notFound('No process found for ' + request.params.name))
        }

        reply(proc.exceptions)
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
