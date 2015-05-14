var logger = require('winston')
var done = require('../../../../../lib/done')
var Boom = require('boom')

module.exports = function getHeapSnapshots (server, callback) {
  server.route({
    path: '/processes/{name}/heapsnapshot/{id}',
    method: 'DELETE',
    handler: function getHeapSnapshotsHandler (request, reply) {
      logger.debug('remove snapshot %s', request.params.name)

      request.server.methods.removeHeapSnapshot(request.auth.credentials, request.params.name, request.params.id, function (error) {
        if (error && error.code === 'ENOPROC') {
          error = Boom.notFound('No process found for ' + request.params.name)
        }

        if (error && error.code === 'ENOHEAP') {
          error = Boom.notFound('No snapshot found for ' + request.params.id)
        }

        done(reply, error)
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
