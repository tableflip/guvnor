var Boom = require('boom')
var outputStream = require('../../../../lib/output-stream')

module.exports = function listAppRefs (server, callback) {
  server.route({
    path: '/apps/{name}/refs',
    method: 'PUT',
    handler: function listAppRefs (request, reply) {
      var stream = outputStream()

      request.server.methods.updateApp(request.auth.credentials, request.params.name, stream, function (error) {
        if (error && error.code === 'ENOAPP') {
          error = Boom.notFound('No app found with name ' + request.params.name)
        }

        stream.done(error)
      })

      reply(stream)
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
