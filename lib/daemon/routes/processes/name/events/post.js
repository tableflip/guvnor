'use strict'

const Joi = require('joi')
const bus = require('../../../../lib/event-bus')
const PROCESS_STATUS = require('../../../../../common/process-status')
const DEBUG = require('good-enough').DEBUG
const CONTEXT = 'daemon:routes:processes:name:events'

module.exports = function receiveProcessEvent (server, callback) {
  server.route({
    path: '/processes/{name}/events',
    method: 'POST',
    handler: function receiveProcessEventHandler (request, reply) {
      request.log([DEBUG, CONTEXT], `${request.params.name} emitted ${request.payload.event}`)

      const args = [request.payload.event].concat(request.payload.args)

      request.server.methods.findProcess({
        user: request.auth.credentials,
        log: request.log.bind(request)
      }, request.params.name, (error, proc) => {
        reply(error)

        if (proc) {
          args.splice(1, 0, request.auth.credentials)
          args.splice(1, 0, proc)
          bus.emit.apply(bus, args)
        }
      })

      if (request.payload.event === 'process:stopping') {
        const interval = setInterval(() => {
          request.server.methods.findProcess({
            user: request.auth.credentials,
            log: request.log.bind(request)
          }, request.params.name, (error, proc) => {
            if (proc && proc.status === PROCESS_STATUS.STOPPED) {
              clearInterval(interval)

              bus.emit('process:stopped', request.auth.credentials, proc)
            }
          })
        }, 500)
      }
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
