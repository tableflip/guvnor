var Joi = require('joi')
var Boom = require('boom')
var through2 = require('through2')
var stringify = require('json-stringify-safe')

module.exports = function installApp (server, callback) {
  server.route({
    path: '/apps',
    method: 'POST',
    handler: function installAppHandler (request, reply) {
      var outputStream = through2()

      request.server.methods.installApp(request.auth.credentials, request.payload.url, {
        name: request.payload.name
      }, outputStream, function (error, app) {
        outputStream.write(new Buffer('-----guvnor-stream-end-----\n'))

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

        outputStream.write(new Buffer(stringify([error, app])))

        outputStream.end()
      })

      reply(outputStream)
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
