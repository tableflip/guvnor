var Boom = require('boom')
var done = require('../../../lib/done')

module.exports = function listAppRefs (server, callback) {
  server.route({
    path: '/apps/{name}',
    method: 'DELETE',
    handler: function listAppRefs (request, reply) {
      request.server.methods.removeApp(request.auth.credentials, request.params.name, function (error, refs) {
        if (error && error.code === 'ENOAPP') {
          error = Boom.notFound('No app found with name ' + request.params.name)
        }

        done(reply, error, refs)
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
