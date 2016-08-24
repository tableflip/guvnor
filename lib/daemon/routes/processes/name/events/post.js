'use strict'

const Joi = require('joi')
const Boom = require('boom')
const context = require('../../../../lib/context')
const bus = require('../../../../lib/event-bus')
const PROCESS_STATUS = require('../../../../../common/process-status')
const DEBUG = require('good-enough').DEBUG
const ERROR = require('good-enough').ERROR
const CONTEXT = 'daemon:routes:processes:name:events:post'

const receiveEvent = (request, name, event, args) => {
  return request.server.methods.findProcess(context(request), name)
  .then(proc => {
    bus.emit.apply(bus, [event, request.auth.credentials.user, proc].concat(args))

    if (request.payload.event === 'process:stopping') {
      // poll to find out when process actually stops
      const interval = setInterval(() => {
        request.server.methods.findProcess(context(request), request.params.name)
        .then(proc => {
          if (proc.status === PROCESS_STATUS.STOPPED) {
            clearInterval(interval)

            bus.emit('process:stopped', request.auth.credentials, proc)
          }
        })
        .catch(error => {
          request.log([ERROR, CONTEXT], error)

          clearInterval(interval)

          proc.status = PROCESS_STATUS.STOPPED

          bus.emit('process:stopped', request.auth.credentials, proc)
        })
      }, 500)
    }
  })
}

const createProcessEvent = (request) => {
  if (request.auth.credentials.scope.indexOf('process') !== -1) {
    request.log([DEBUG, CONTEXT], `${request.params.name} emitted ${request.payload.event} with args ${JSON.stringify(request.payload.args)}`)

    return receiveEvent(request, request.params.name, request.payload.event, request.payload.args)
  } else if (request.auth.credentials.scope.indexOf('user') !== -1) {
    request.log([DEBUG, CONTEXT], `Sending ${request.payload.event} to ${request.params.name} with args ${JSON.stringify(request.payload.args)}`)

    return request.server.methods.sendEvent(
      context(request),
      request.params.name,
      request.payload.event,
      request.payload.args,
      request.payload.worker
    )
  }

  return Promise.reject(Boom.notAcceptable('An event should be sent by or to a process'))
}

module.exports = {
  path: '/processes/{name}/events',
  method: 'POST',
  handler: createProcessEvent,
  config: {
    auth: {
      strategy: 'certificate',
      scope: ['process', 'user']
    },
    validate: {
      payload: {
        event: Joi.string().required(),
        args: Joi.array().default([]),
        worker: Joi.string()
      }
    }
  }
}
