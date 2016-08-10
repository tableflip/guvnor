'use strict'

const Joi = require('joi')
const Boom = require('boom')
const outputStream = require('../../lib/output-stream')

module.exports = function installApp (server, callback) {
  server.route({
    path: '/apps',
    method: 'POST',
    handler: function installAppHandler (request, reply) {
      const stream = outputStream()
      const response = reply(stream)

      request.server.methods.installApp({
        user: request.auth.credentials,
        log: request.log.bind(request)
      }, request.payload.url, {
        name: request.payload.name
      }, stream, function (error, app) {
        if (error) {
          if (error.code === 'ENOPACKAGE.JSON') {
            error = Boom.preconditionFailed('No package.json found in repository')
          } else if (error.code === 'EAPPEXIST' || error.code === 'ENOTEMPTY') {
            error = Boom.conflict('An app with that name already exists')
          } else {
            error = Boom.wrap(error)
          }

          response.statusCode = error.output.statusCode
          error = error.output.payload
        }

        stream.done(error, app)
      })
    },
    config: {
      auth: {
        strategy: 'certificate',
        scope: ['user']
      },
      validate: {
        payload: {
          url: Joi.string().required(),
          name: Joi.string()
            .lowercase()
            .replace(/[^0-9a-z-]+/g, ' ')
            .trim()
            .replace(/\s+/g, '.')
        }
      }
    }
  })

  callback()
}
