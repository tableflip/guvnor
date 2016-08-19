'use strict'

module.exports = function getProcesses (server, callback) {
  server.route({
    path: '/processes',
    method: 'GET',
    handler: function getProcessesHandler (request, reply) {
      return request.server.methods.listProcessDetails({
        user: request.auth.credentials,
        log: request.log.bind(request)
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
