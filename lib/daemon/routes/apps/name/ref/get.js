'use strict'

const Joi = require('joi')
const context = require('../../../../lib/context')

const getAppRef = (request, reply) => {
  return request.server.methods.findAppRef(context(request), request.params.name)
}

module.exports = {
  path: '/apps/{name}/ref',
  method: 'GET',
  handler: getAppRef,
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
