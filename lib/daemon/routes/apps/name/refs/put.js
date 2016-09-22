'use strict'

const Joi = require('joi')
const outputStream = require('../../../../lib/output-stream')
const context = require('../../../../lib/context')

const updateAppRefs = (request, reply) => {
  const stream = outputStream()
  reply(stream)

  request.server.methods.updateApp(context(request), request.params.name, stream)
  .then(app => {
    stream.done(null, app)
  })
  .catch(error => {
    stream.done(error)
  })
}

module.exports = {
  path: '/apps/{name}/refs',
  method: 'PUT',
  handler: updateAppRefs,
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
        }
      }
    }
  }
}
