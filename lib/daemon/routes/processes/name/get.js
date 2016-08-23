'use strict'

const Joi = require('joi')
const context = require('../../../lib/context')

const getProcess = (request, reply) => {
  return request.server.methods.findProcess(context(request), request.params.name)
}

module.exports = {
  path: '/processes/{name}',
  method: 'GET',
  handler: getProcess,
  config: {
    auth: {
      strategy: 'certificate',
      scope: ['user']
    },
    validate: {
      params: {
        name: Joi.string().required()
      }
    },
    plugins: {
      'error-handler': {
        'ENOENT': (request) => {
          return {
            code: 404,
            message: `No process found for ${request.params.name}`
          }
        },
        'ENOPROC': (request) => {
          return {
            code: 404,
            message: `No process found for ${request.params.name}`
          }
        }
      }
    }
  }
}
