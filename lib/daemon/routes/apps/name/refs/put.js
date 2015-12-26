var Boom = require('boom')
var outputStream = require('../../../../lib/output-stream')

module.exports = function updateAppRefs (server, callback) {
  server.route({
    path: '/apps/{name}/refs',
    method: 'PUT',
    handler: function updateAppRefsHandler (request, reply) {
      var stream = outputStream()
      var response = reply(stream)

      request.server.methods.updateApp({
        user: request.auth.credentials,
        log: request.log.bind(request)
      }, request.params.name, stream, function (error, app) {
        if (error) {
          if (error.code === 'ENOAPP' || error.code === 'ENOENT') {
            error = Boom.notFound('No app found with name ' + request.params.name)
          } else {
            error = Boom.wrap(error)
          }

          response.statusCode = error.output.statusCode
        }

        stream.done(error, app)
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
