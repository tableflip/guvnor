'use strict'

const Joi = require('joi')
const context = require('../../../lib/context')
const processStatistics = require('../../../lib/process-statistics')

const removeProcess = (request, reply) => {
  request.server.methods.removeProcess(context(request), request.params.name)
  .then(() => {
    processStatistics.remove(request.auth.credentials, request.params.name)
  })
}

module.exports = {
  path: '/processes/{name}',
  method: 'DELETE',
  handler: removeProcess,
  config: {
    auth: {
      strategy: 'certificate',
      scope: ['user']
    },
    validate: {
      params: {
        name: Joi.string().required()
      }
    }
  }
}
