'use strict'

const Joi = require('joi')
const context = require('../../../../lib/context')

const getProcessLogs = (request, reply) => {
  const options = {
    follow: request.query.follow,
    script: request.params.name
  }

  request.server.methods.fetchLogs(context(request), options)
  .then(result => {
    reply(result.stream)
      .header('Content-Type', 'text/plain')
  })
  .catch(error => {
    reply(error)
  })
}

module.exports = {
  path: '/processes/{name}/logs',
  method: 'GET',
  handler: getProcessLogs,
  config: {
    auth: {
      strategy: 'certificate',
      scope: ['user']
    },
    validate: {
      query: {
        follow: Joi.boolean().default(false)
      },
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
