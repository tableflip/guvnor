'use strict'

const context = require('../../lib/context')

const listApps = (request, reply) => {
  return request.server.methods.listApps(context(request))
}

module.exports = {
  path: '/apps',
  method: 'GET',
  handler: listApps,
  config: {
    auth: {
      strategy: 'certificate',
      scope: ['user']
    }
  }
}
