'use strict'

const Joi = require('joi')
const Boom = require('boom')
const context = require('../../../../lib/context')
const processStatistics = require('../../../../lib/process-statistics')

const getExceptions = (request) => {
  return request.server.methods.findProcess(context(request), request.params.name)
  .then(proc => processStatistics(context(request), request.params.name))
  .then(stats => {
    stats.exceptions = []
  })
}

module.exports = {
  path: '/processes/{name}/exceptions',
  method: 'DELETE',
  handler: getExceptions,
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
