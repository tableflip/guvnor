'use strict'

const context = require('../../../../lib/context')

const forceProcessGc = (request, reply) => {
  return request.server.methods.forceGc(context(request), request.params.name)
}

module.exports = {
  path: '/processes/{name}/gc',
  method: 'POST',
  handler: forceProcessGc,
  config: {
    auth: {
      strategy: 'certificate',
      scope: ['user']
    }
  }
}
