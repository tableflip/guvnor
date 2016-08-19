'use strict'

const context = require('../../../../../lib/context')

const getHeapSnapshots = (request, reply) => {
  return request.server.methods.removeHeapSnapshot(context(request), request.params.name, request.params.id)
}

module.exports = {
  path: '/processes/{name}/heapsnapshots/{id}',
  method: 'DELETE',
  handler: getHeapSnapshots,
  config: {
    auth: {
      strategy: 'certificate',
      scope: ['user']
    }
  }
}
