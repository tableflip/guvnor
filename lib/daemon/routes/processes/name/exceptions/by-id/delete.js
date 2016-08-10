'use strict'

const Joi = require('joi')
const Boom = require('boom')
const processStatistics = require('../../../../../lib/process-statistics')

module.exports = function getExceptions (server, callback) {
  server.route({
    path: '/processes/{name}/exceptions/{id}',
    method: 'DELETE',
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

        proc.exceptions = proc.exceptions.filter(function (exception) {
          return exception.id !== request.params.id
        })

        reply()
      })
    },
    config: {
      auth: {
        strategy: 'certificate',
        scope: ['user']
      },
      validate: {
        params: {
          name: Joi.string().required(),
          id: Joi.string().required()
        }
      }
    }
  })

  callback()
}
