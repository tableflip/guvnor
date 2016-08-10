'use strict'

const Boom = require('boom')
const async = require('async')

module.exports = function getHeapSnapshots (server, callback) {
  server.route({
    path: '/processes/{name}/heapsnapshots',
    method: 'DELETE',
    handler: function getHeapSnapshotsHandler (request, reply) {
      request.server.methods.listHeapSnapshots({
        user: request.auth.credentials,
        log: request.log.bind(request)
      }, request.params.name, function (error, snapshots) {
        if (error && error.code === 'ENOPROC') {
          error = Boom.notFound(`No process found for ${request.params.name}`)
        }

        async.parallel(snapshots.map(function (snapshot) {
          return function (next) {
            request.server.methods.removeHeapSnapshot({
              user: request.auth.credentials,
              log: request.log.bind(request)
            }, request.params.name, snapshot.id, function (error) {
              if (error && error.code === 'ENOHEAP') {
                error = Boom.notFound(`No snapshot found for ${request.params.id}`)
              }

              next(error)
            })
          }
        }), function (error) {
          reply(error)
        })
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
