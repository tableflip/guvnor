'use strict'

const Joi = require('joi')
const outputStream = require('../../lib/output-stream')
const context = require('../../lib/context')

const installApp = (request, reply) => {
  const stream = outputStream()
  reply(stream)

  request.server.methods.installApp(context(request), request.payload.url, {
    name: request.payload.name
  }, stream)
  .then(app => {
    stream.done(null, app)
  })
  .catch(error => {
    stream.done(error)
  })
}

module.exports = {
  path: '/apps',
  method: 'POST',
  handler: installApp,
  config: {
    auth: {
      strategy: 'certificate',
      scope: ['user']
    },
    validate: {
      payload: {
        url: Joi.string().required(),
        name: Joi.string()
          .lowercase()
          .replace(/[^0-9a-z-_]+/g, ' ')
          .trim()
          .replace(/\s+/g, '.')
      }
    },
    plugins: {
      'error-handler': {
        'EAPPEXIST': (request) => {
          return {
            code: 409,
            message: `An app with the name ${request.params.name} already exists`
          }
        }
      }
    }
  }
}
