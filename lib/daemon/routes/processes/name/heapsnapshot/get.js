var Boom = require('boom')

module.exports = function getHeapSnapshots (server, callback) {
  server.route({
    path: '/processes/{name}/heapsnapshots',
    method: 'GET',
    handler: function getHeapSnapshotsHandler (request, reply) {
      request.server.methods.listHeapSnapshots({
        user: request.auth.credentials,
        log: request.log.bind(request)
      }, request.params.name, function (error, snapshots) {
        if (error && error.code === 'ENOPROC') {
          error = Boom.notFound('No process found for ' + request.params.name)
        }

        reply(error, snapshots)
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
