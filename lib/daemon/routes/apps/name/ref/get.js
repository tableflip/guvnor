var Boom = require('boom')
var done = require('../../../../lib/done')

module.exports = function getAppRef (server, callback) {
  server.route({
    path: '/apps/{name}/ref',
    method: 'GET',
    handler: function getAppRefHandler (request, reply) {
      request.server.methods.findAppRef(request.auth.credentials, request.params.name, function (error, ref) {
        if (error && error.code === 'ENOAPP') {
          error = Boom.notFound('No app found with name ' + request.params.name)
        }

        done(reply, error, ref)
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
