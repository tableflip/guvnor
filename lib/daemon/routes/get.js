'use strict'

const context = require('../lib/context')

const getStatus = (request, reply) => {
  return request.server.methods.getServerStatus(context(request))
}

module.exports = {
  path: '/',
  method: 'GET',
  handler: getStatus,
  config: {
    auth: {
      strategy: 'certificate',
      scope: ['user']
    }
  }
}
