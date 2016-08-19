'use strict'

const context = require('../../lib/context')

const getProcesses = (request, reply) => {
  return request.server.methods.listProcessDetails(context(request))
}

module.exports = {
  path: '/processes',
  method: 'GET',
  handler: getProcesses,
  config: {
    auth: {
      strategy: 'certificate',
      scope: ['user']
    }
  }
}
