var Joi = require('joi')
var Boom = require('boom')
var done = require('../../../lib/done')

module.exports = function getProcess (server, callback) {
  server.route({
    path: '/processes/{name}',
    method: 'GET',
    handler: function getProcessHandler (request, reply) {
      request.server.methods.getProcess(request.auth.credentials, request.params.name, function (error, proc) {
        done(reply, error || proc || Boom.notFound('No process found for ' + request.params.name))
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