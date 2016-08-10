'use strict'

const Joi = require('joi')
const Boom = require('boom')
const processStatistics = require('../../../../lib/process-statistics')

module.exports = function getExceptions (server, callback) {
  server.route({
    path: '/processes/{name}/exceptions',
    method: 'GET',
    handler: function getExceptionsHandler (request, reply) {
      processStatistics({
        user: request.auth.credentials,
        log: request.log.bind(request)
      }, request.params.name, function (error, proc) {
        if (error) {
          return reply(Boom.wrap(error))
        }

        if (!proc) {
          return reply(Boom.notFound(`No process found for ${request.params.name}`))
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
