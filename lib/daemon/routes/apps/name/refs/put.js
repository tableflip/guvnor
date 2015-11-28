var Boom = require('boom')
var done = require('../../../../lib/done')

module.exports = function listAppRefs (server, callback) {
  server.route({
    path: '/apps/{name}/refs',
    method: 'PUT',
    handler: function listAppRefs (request, reply) {
      var outputStream = through2()

      request.server.methods.updateApp(request.auth.credentials, request.params.name, function (error) {
        if (error && error.code === 'ENOAPP') {
          error = Boom.notFound('No app found with name ' + request.params.name)
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
