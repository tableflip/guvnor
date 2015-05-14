var done = require('../../lib/done')

module.exports = function listApps (server, callback) {
  server.route({
    path: '/apps',
    method: 'GET',
    handler: function listAppsHandler (request, reply) {
      request.server.methods.listApps(request.auth.credentials, done.bind(null, reply))
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
