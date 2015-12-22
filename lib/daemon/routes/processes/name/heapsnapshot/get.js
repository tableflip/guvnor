var logger = require('winston')
var done = require('../../../../lib/done')
var Boom = require('boom')

module.exports = function getHeapSnapshots (server, callback) {
  server.route({
    path: '/processes/{name}/heapsnapshots',
    method: 'GET',
    handler: function getHeapSnapshotsHandler (request, reply) {
      logger.debug('take snapshot %s', request.params.name)

      request.server.methods.listHeapSnapshots(request.auth.credentials, request.params.name, function (error, snapshots) {
        if (error && error.code === 'ENOPROC') {
          error = Boom.notFound('No process found for ' + request.params.name)
        }

        done(reply, error, snapshots)
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
