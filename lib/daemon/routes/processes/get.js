var done = require('../../lib/done')
var logger = require('winston')

module.exports = function getProcesses (server, callback) {
  server.route({
    path: '/processes',
    method: 'GET',
    handler: function getProcessesHandler (request, reply) {
      logger.debug('Listing processes')
      request.server.methods.listProcessStatuses(request.auth.credentials, done.bind(null, reply))
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
