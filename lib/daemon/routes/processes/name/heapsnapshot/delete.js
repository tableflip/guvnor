'use strict'

const Joi = require('joi')
const context = require('../../../../lib/context')

const deleteHeapSnapshots = (request, reply) => {
  return request.server.methods.listHeapSnapshots(context(request), request.params.name)
  .then(snapshots => Promise.all(snapshots.map(snapshot => request.server.methods.removeHeapSnapshot(context(request), request.params.name, snapshot.id))))
}

module.exports = {
  path: '/processes/{name}/heapsnapshots',
  method: 'DELETE',
  handler: deleteHeapSnapshots,
  config: {
    auth: {
      strategy: 'certificate',
      scope: ['user']
    },
    validate: {
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
