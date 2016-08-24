'use strict'

const Joi = require('joi')
const context = require('../../../lib/context')
const ERROR = require('good-enough').ERROR
const CONTEXT = 'daemon:routes:processes:name:logs:get'

const getLogs = (request, reply) => {
  request.server.methods.fetchLogs(context(request), request.query)
  .then(result => {
    reply(result.stream)
      .header('Content-Type', 'text/plain')
  })
}

module.exports = {
  path: '/processes/logs',
  method: 'GET',
  handler: getLogs,
  config: {
    auth: {
      strategy: 'certificate',
      scope: ['user']
    },
    validate: {
      query: {
        follow: Joi.boolean().default(false)
      }
    }
  }
}
