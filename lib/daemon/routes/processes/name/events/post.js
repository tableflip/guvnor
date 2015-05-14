var Joi = require('joi')
var logger = require('winston')
var websocketServer = require('../../../../start-server/create-websocket-server')
var async = require('async')
var processOperations = require('../../../../../process-operations')
var done = require('../../../../lib/done')

module.exports = function receiveProcessEvent (server, callback) {
  server.route({
    path: '/processes/{name}/events',
    method: 'POST',
    handler: function receiveProcessEventHandler (request, reply) {
      logger.debug('process event %s %s', request.params.name, request.payload.event)

      var args = [request.payload.event].concat(request.payload.args)

      async.parallel({
        socket: websocketServer,
        proc: processOperations.getProcess.bind(null, request.auth.credentials, request.params.name)
      }, function (error, results) {
        done(reply, error)

        if (results && results.socket && results.proc) {
          args.unshift(results.proc)
          results.socket.emit.apply(results.socket, args)
        }
      })
    },
    config: {
      auth: {
        strategy: 'certificate',
        scope: ['process']
      },
      validate: {
        payload: {
          event: Joi.string().required(),
          args: Joi.array().required()
        }
      }
    }
  })

  callback()
}
