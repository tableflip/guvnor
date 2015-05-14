var logger = require('winston')
var done = require('../../../../lib/done')
var Boom = require('boom')

module.exports = function getHeapSnapshots (server, callback) {
  server.route({
    path: '/processes/{name}/heapsnapshot',
    method: 'GET',
    handler: function getHeapSnapshotsHandler (request, reply) {
      logger.debug('take snapshot %s', request.params.name)

      request.server.methods.listHeapSnapshots(request.auth.credentials, request.params.name, function (error) {
        if (error && error.code === 'ENOPROC') {
          error = Boom.notFound('No process found for ' + request.params.name)
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
