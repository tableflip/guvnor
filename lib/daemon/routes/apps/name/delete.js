'use strict'

const context = require('../../../lib/context')

const deleteApp = (request, reply) => {
  return request.server.methods.removeApp(context(request), request.params.name)
}

module.exports = {
  path: '/apps/{name}',
  method: 'DELETE',
  handler: deleteApp,
  config: {
    auth: {
      strategy: 'certificate',
      scope: ['user']
    }
  }
}
