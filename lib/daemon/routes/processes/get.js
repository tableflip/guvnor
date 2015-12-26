
module.exports = function getProcesses (server, callback) {
  server.route({
    path: '/processes',
    method: 'GET',
    handler: function getProcessesHandler (request, reply) {
      request.server.methods.listProcessDetails({
        user: request.auth.credentials,
        log: request.log.bind(request)
      }, reply)
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
