'use strict'

const Joi = require('joi')
const context = require('../../../lib/context')

const getApp = (request, reply) => {
  return request.server.methods.findApp(context(request), request.params.name)
}

module.exports = {
  path: '/apps/{name}',
  method: 'GET',
  handler: getApp,
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
