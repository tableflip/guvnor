'use strict'

const Joi = require('joi')
const Boom = require('boom')
const outputStream = require('../../../lib/output-stream')
const context = require('../../../lib/context')
const INFO = require('good-enough').INFO
const WARN = require('good-enough').WARN
const CONTEXT = 'daemon:routes:apps:name:patch'

const setAppRef = (request, reply) => {
  const stream = outputStream()
  reply(stream)

  request.log([INFO, CONTEXT], `Switching ref to ${request.payload.ref} for ${request.params.name}`)

  request.server.methods.setAppRef(context(request), request.params.name, request.payload.ref, stream)
  .then(app => {
    request.log([INFO, CONTEXT], `Switched ref to ${request.payload.ref} for ${request.params.name}`)
    stream.done(null, app)
  })
  .catch(error => {
    request.log([WARN, CONTEXT], `Encountered error while switching ref to ${request.payload.ref} for ${request.params.name}`)
    request.log([WARN, CONTEXT], error)

    stream.done(Boom.wrap(error))
  })
}

module.exports = {
  path: '/apps/{name}',
  method: 'PATCH',
  handler: setAppRef,
  config: {
    auth: {
      strategy: 'certificate',
      scope: ['user']
    },
    validate: {
      payload: {
        ref: Joi.string().required().trim()
      },
      params: {
        name: Joi.string()
          .required()
          .lowercase()
          .replace(/[^0-9a-z-_]+/g, ' ')
          .trim()
          .replace(/\s+/g, '.')
      }
    },
    plugins: {
      'error-handler': {
        'ENOAPP': (request) => {
          return {
            code: 404,
            message: `No app found for ${request.params.name}`
          }
        },
        'ERUNNING': (request) => {
          return {
            code: 409,
            message: `${request.params.name} was running`
          }
        },
        'ENOREF': (request) => {
          return {
            code: 400,
            message: `${request.payload.ref} was not a valid ref for ${request.params.name}`
          }
        }
      }
    }
  }
}
