'use strict'

const Boom = require('boom')

module.exports = function takeHeapSnapshot (server, callback) {
  server.route({
    path: '/processes/{name}/heapsnapshots',
    method: 'POST',
    handler: function takeHeapSnapshotHandler (request, reply) {
      request.server.methods.takeHeapSnapshot({
        user: request.auth.credentials,
        log: request.log.bind(request)
      }, request.params.name, function (error, snapshot) {
        if (error && error.code === 'ENOPROC') {
          error = Boom.notFound(`No process found for ${request.params.name}`)
        }

        reply(error, snapshot)
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
