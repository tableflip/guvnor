'use strict'

const Joi = require('joi')
const context = require('../../../../lib/context')
const DEBUG = require('good-enough').DEBUG
const CONTEXT = 'daemon:routes:processes:name:signals:post'

const sendSignal = (request) => {
  request.log([DEBUG, CONTEXT], `Sending ${request.payload.signal} to ${request.params.name}`)

  return request.server.methods.sendSignal(
    context(request),
    request.params.name,
    request.payload.signal,
    request.payload.kill,
    request.payload.worker
  )
}

module.exports = {
  path: '/processes/{name}/signals',
  method: 'POST',
  handler: sendSignal,
  config: {
    auth: {
      strategy: 'certificate',
      scope: ['user']
    },
    validate: {
      payload: {
        signal: Joi.string().required(),
        kill: Joi.boolean().default(false),
        worker: Joi.string()
      },
      params: {
        name: Joi.string()
          .required()
          .lowercase()
          .replace(/[^0-9a-z-_]+/g, ' ')
          .trim()
          .replace(/\s+/g, '.')
      }
    }
  }
}
