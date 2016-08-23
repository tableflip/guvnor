'use strict'

const context = require('../../../../lib/context')

const takeHeapSnapshot = (request, reply) => {
  return request.server.methods.takeHeapSnapshot(context(request), request.params.name)
}

module.exports = {
  path: '/processes/{name}/heapsnapshots',
  method: 'POST',
  handler: takeHeapSnapshot,
  config: {
    auth: {
      strategy: 'certificate',
      scope: ['user']
    }
  }
}
