var Joi = require('joi')
var Boom = require('boom')
var done = require('../../../lib/done')

module.exports = function getStatus (server, callback) {
  server.route({
    path: '/status',
    method: 'GET',
    handler: function getStatus (request, reply) {
      request.server.methods.getServerStatus(request.auth.credentials, function (error, status) {
        done(reply, error || status)
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
