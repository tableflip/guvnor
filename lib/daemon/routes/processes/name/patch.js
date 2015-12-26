var Joi = require('joi')
var Boom = require('boom')
var os = require('os')

module.exports = function updateProcess (server, callback) {
  server.route({
    path: '/processes/{name}',
    method: 'PATCH',
    handler: function updateProcessHandler (request, reply) {
      if (request.payload.status === 'start') {
        request.server.methods.startProcess({
          user: request.auth.credentials,
          log: request.log.bind(request)
        }, request.params.name, function startedProcess (error, proc) {
          if (error && error.code === 'ERUNNING') {
            return reply(Boom.conflict('Process ' + request.params.name + ' is already running'))
          }

          reply(error, proc)
        })
      } else if (request.payload.status === 'stop') {
        request.server.methods.stopProcess({
          user: request.auth.credentials,
          log: request.log.bind(request)
        }, request.params.name, reply)
      }

      if (request.payload.workers) {
        request.server.methods.setNumWorkers({
          user: request.auth.credentials,
          log: request.log.bind(request)
        }, request.params.name, request.payload.workers, function (error) {
          if (error && error.code === 'ENOPROC') {
            error = Boom.notFound('No process found for ' + request.params.name)
          }

          reply(error)
        })
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
          status: Joi.string().valid('start', 'stop'),
          workers: Joi.number().integer().min(1).max(os.cpus().length)
        }
      }
    }
  })

  callback()
}
