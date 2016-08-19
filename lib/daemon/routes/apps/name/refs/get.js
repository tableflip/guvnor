'use strict'

const context = require('../../../../lib/context')

const listAppRefs = (request, reply) => {
  return request.server.methods.listAppRefs(context(request), request.params.name)
}

module.exports = {
  path: '/apps/{name}/refs',
  method: 'GET',
  handler: listAppRefs,
  config: {
    auth: {
      strategy: 'certificate',
      scope: ['user']
    }
  }
}
