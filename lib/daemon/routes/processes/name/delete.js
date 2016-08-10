'use strict'

const Joi = require('joi')
const Boom = require('boom')
const processStatistics = require('../../../lib/process-statistics')

module.exports = function removeProcess (server, callback) {
  server.route({
    path: '/processes/{name}',
    method: 'DELETE',
    handler: function removeProcessHandler (request, reply) {
      request.server.methods.removeProcess({
        user: request.auth.credentials,
        log: request.log.bind(request)
      }, request.params.name, function (error) {
        if (error && error.code === 'ENOENT') {
          return reply(Boom.notFound())
        }

        processStatistics.remove(request.auth.credentials, request.params.name)

        reply(error)
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
