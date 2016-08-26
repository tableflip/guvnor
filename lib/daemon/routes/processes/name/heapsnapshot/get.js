'use strict'

const Joi = require('joi')
const context = require('../../../../lib/context')

const getHeapSnapshots = (request, reply) => {
  return request.server.methods.listHeapSnapshots(context(request), request.params.name)
}

module.exports = {
  path: '/processes/{name}/heapsnapshots',
  method: 'GET',
  handler: getHeapSnapshots,
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
