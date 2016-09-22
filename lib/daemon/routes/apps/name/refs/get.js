'use strict'

const Joi = require('joi')
const context = require('../../../../lib/context')

const listAppRefs = (request, reply) => {
  return request.server.methods.listAppRefs(context(request), request.params.name)
}

module.exports = {
  path: '/apps/{name}/refs',
  method: 'GET',
  handler: listAppRefs,
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
        }
      }
    }
  }
}
