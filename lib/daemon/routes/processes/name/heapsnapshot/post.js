'use strict'

const Joi = require('joi')
const context = require('../../../../lib/context')

const takeHeapSnapshot = (request, reply) => {
  return request.server.methods.takeHeapSnapshot(context(request), request.params.name)
}

module.exports = {
  path: '/processes/{name}/heapsnapshots',
  method: 'POST',
  handler: takeHeapSnapshot,
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
