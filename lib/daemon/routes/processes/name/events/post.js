var Joi = require('joi')
var bus = require('../../../../lib/event-bus')
var DEBUG = require('good-enough').DEBUG
var CONTEXT = 'daemon:routes:processes:name:events'

module.exports = function receiveProcessEvent (server, callback) {
  server.route({
    path: '/processes/{name}/events',
    method: 'POST',
    handler: function receiveProcessEventHandler (request, reply) {
      request.log([DEBUG, CONTEXT], request.params.name + ' emitted ' + request.payload.event)

      var args = [request.payload.event].concat(request.payload.args)

      request.server.methods.findProcess({
        user: request.auth.credentials,
        log: request.log.bind(request)
      }, request.params.name, function (error, proc) {
        reply(error)

        if (proc) {
          args.splice(1, 0, request.auth.credentials)
          args.splice(1, 0, proc)
          bus.emit.apply(bus, args)
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
