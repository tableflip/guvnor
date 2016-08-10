'use strict'

const Boom = require('boom')

module.exports = function getHeapSnapshots (server, callback) {
  server.route({
    path: '/processes/{name}/heapsnapshots/{id}',
    method: 'DELETE',
    handler: function getHeapSnapshotsHandler (request, reply) {
      request.server.methods.removeHeapSnapshot({
        user: request.auth.credentials,
        log: request.log.bind(request)
      }, request.params.name, request.params.id, function (error) {
        if (error && error.code === 'ENOPROC') {
          error = Boom.notFound(`No process found for ${request.params.name}`)
        }

        if (error && error.code === 'ENOHEAP') {
          error = Boom.notFound(`No snapshot found for ${request.params.id}`)
        }

        reply(error)
      })
    },
    config: {
      auth: {
        strategy: 'certificate',
        scope: ['user']
      }
    }
  })

  callback()
}
