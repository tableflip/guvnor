var logger = require('winston')
var done = require('../../../../lib/done')
var Boom = require('boom')

module.exports = function takeHeapSnapshot (server, callback) {
  server.route({
    path: '/processes/{name}/heapsnapshots',
    method: 'POST',
    handler: function takeHeapSnapshotHandler (request, reply) {
      logger.debug('take snapshot %s', request.params.name)

      request.server.methods.takeHeapSnapshot(request.auth.credentials, request.params.name, function (error, snapshot) {
        if (error && error.code === 'ENOPROC') {
          error = Boom.notFound('No process found for ' + request.params.name)
        }

        done(reply, error, snapshot)
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
