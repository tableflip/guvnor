'use strict'

const Joi = require('joi')
const Boom = require('boom')
const os = require('os')
const context = require('../../../lib/context')

const updateProcess = (request, reply) => {
  if (request.payload.status === 'start') {
    return request.server.methods.startProcess(context(request), request.params.name)
  } else if (request.payload.status === 'stop') {
    return request.server.methods.stopProcess(context(request), request.params.name)
  }

  if (request.payload.workers) {
    return request.server.methods.setNumWorkers(context(request), request.params.name, request.payload.workers)
  }

  return Promise.reject(Boom.notAcceptable('A status or some workers should be sent'))
}

module.exports = {
  path: '/processes/{name}',
  method: 'PATCH',
  handler: updateProcess,
  config: {
    auth: {
      strategy: 'certificate',
      scope: ['user']
    },
    validate: {
      params: {
        name: Joi.string()
          .required()
          .lowercase()
          .replace(/[^0-9a-z-_]+/g, ' ')
          .trim()
          .replace(/\s+/g, '.')
      },
      payload: {
        status: Joi.string().valid('start', 'stop'),
        workers: Joi.number().integer().min(1).max(os.cpus().length)
      }
    }
  }
}
