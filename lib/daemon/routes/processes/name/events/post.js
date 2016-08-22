'use strict'

const Joi = require('joi')
const context = require('../../../../lib/context')
const bus = require('../../../../lib/event-bus')
const PROCESS_STATUS = require('../../../../../common/process-status')
const DEBUG = require('good-enough').DEBUG
const ERROR = require('good-enough').ERROR
const CONTEXT = 'daemon:routes:processes:name:events'

const receiveProcessEvent = (request, reply) => {
  request.log([DEBUG, CONTEXT], `${request.params.name} emitted ${request.payload.event}`)

  const args = [request.payload.event].concat(request.payload.args)

  return request.server.methods.findProcess(context(request), request.params.name)
  .then(proc => {
    if (proc) {
      args.splice(1, 0, request.auth.credentials)
      args.splice(1, 0, proc)
      bus.emit.apply(bus, args)
    }

    if (request.payload.event === 'process:stopping') {
      // poll to find out when process actually stops
      const interval = setInterval(() => {
        request.server.methods.findProcess({
          user: request.auth.credentials,
          log: request.log.bind(request)
        }, request.params.name)
        .then(proc => {
          if (proc && proc.status === PROCESS_STATUS.STOPPED) {
            clearInterval(interval)

            bus.emit('process:stopped', request.auth.credentials, proc)
          }
        })
        .catch(error => {
          request.log([ERROR, CONTEXT], error)
        })
      }, 500)
    }
  })
}

module.exports = {
  path: '/processes/{name}/events',
  method: 'POST',
  handler: receiveProcessEvent,
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
}
