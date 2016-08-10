'use strict'

const Boom = require('boom')
const done = require('../../../lib/done')

module.exports = function deleteApp (server, callback) {
  server.route({
    path: '/apps/{name}',
    method: 'DELETE',
    handler: function deleteAppHandler (request, reply) {
      request.server.methods.removeApp({
        user: request.auth.credentials,
        log: request.log.bind(request)
      }, request.params.name, function (error, refs) {
        if (error && error.code === 'ENOAPP') {
          error = Boom.notFound(`No app found with name ${request.params.name}`)
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
