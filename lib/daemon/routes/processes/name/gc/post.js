'use strict'

const Joi = require('joi')
const context = require('../../../../lib/context')

const forceProcessGc = (request) => {
  return request.server.methods.forceGc(context(request), request.params.name)
}

module.exports = {
  path: '/processes/{name}/gc',
  method: 'POST',
  handler: forceProcessGc,
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
    }
  }
}
