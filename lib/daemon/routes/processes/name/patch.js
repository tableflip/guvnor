var Joi = require('joi')
var done = require('../../../lib/done')
var Boom = require('boom')
var logger = require('winston')

module.exports = function updateProcess (server, callback) {
  server.route({
    path: '/processes/{name}',
    method: 'PATCH',
    handler: function updateProcessHandler (request, reply) {
      if (request.payload.status === 'start') {
        logger.debug('Starting process %s', request.params.name)

        request.server.methods.startProcess(request.auth.credentials, request.params.name, function startedProcess (error, proc) {
          if (error && error.code === 'ERUNNING') {
            return reply(Boom.conflict('Process ' + request.params.name + ' is already running'))
          }

          done(reply, error, proc)
        })
      } else if (request.payload.status === 'stop') {
        logger.debug('Stopping process %s', request.params.name)

        request.server.methods.stopProcess(request.auth.credentials, request.params.name, done.bind(null, reply))
      }
    },
    config: {
      auth: {
        strategy: 'certificate',
        scope: ['user']
      },
      validate: {
        params: {
          name: Joi.string().required()
        },
        payload: {
          status: Joi.string().valid('start', 'stop').required()
        }
      }
    }
  })

  callback()
}
