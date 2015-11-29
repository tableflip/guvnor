var Joi = require('joi')
var Boom = require('boom')
var outputStream = require('../../lib/output-stream')

module.exports = function installApp (server, callback) {
  server.route({
    path: '/apps',
    method: 'POST',
    handler: function installAppHandler (request, reply) {
      var stream = outputStream()

      request.server.methods.installApp(request.auth.credentials, request.payload.url, {
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

          error = error.output.payload
        }

        stream.end(error, app)
      })

      reply(stream)
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
