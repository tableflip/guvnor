var Boom = require('boom')
var Joi = require('joi')
var outputStream = require('../../../lib/output-stream')

module.exports = function setAppRef (server, callback) {
  server.route({
    path: '/apps/{name}',
    method: 'PATCH',
    handler: function setAppRefHandler (request, reply) {
      var stream = outputStream()
      var response = reply(stream)

      request.server.methods.setAppRef(request.auth.credentials, request.params.name, request.payload.ref, stream, function (error, app) {
        if (error) {
          if (error.code === 'ENOAPP' || error.code === 'ENOENT') {
            error = Boom.notFound('No app found with name ' + request.params.name)
          } else {
            error = Boom.wrap(error)
          }

          response.statusCode = error.output.statusCode
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
          ref: Joi.string().required().trim()
        }
      }
    }
  })

  callback()
}
