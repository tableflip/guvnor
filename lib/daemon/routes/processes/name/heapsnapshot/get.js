'use strict'

const context = require('../../../../lib/context')

const getHeapSnapshots = (request, reply) => {
  return request.server.methods.listHeapSnapshots(context(request), request.params.name)
}

module.exports = {
  path: '/processes/{name}/heapsnapshots',
  method: 'GET',
  handler: getHeapSnapshots,
  config: {
    auth: {
      strategy: 'certificate',
      scope: ['user']
    }
  }
}
