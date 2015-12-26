var Joi = require('joi')
var Boom = require('boom')
var fs = require('fs')
var path = require('path')
var DEBUG = require('good-enough').DEBUG
var ERROR = require('good-enough').ERROR
var CONTEXT = 'daemon:routes:certificates:user:delete'

module.exports = function routeCreateUserCertificate (server, callback) {
  server.route({
    path: '/certificates/user',
    method: 'DELETE',
    handler: function createUserCertificateHandler (request, reply) {
      request.server.methods.findUserDetails({
        user: request.payload.user,
        log: request.log.bind(request)
      }, function (error, user) {
        if (error) {
          return reply(Boom.wrap(error))
        }

        var bundleFile = path.join(user.home, '.config', 'guvnor', user.name + '.keys')

        request.log([DEBUG, CONTEXT], 'Removing certificate for user ' + user.name + ' at ' + bundleFile)

        fs.unlink(bundleFile, function (error) {
          if (error) {
            if (error.code === 'ENOENT') {
              // tried to remove a file that didn't exist
              error = null
            } else {
              request.log([ERROR, CONTEXT], error)
              return reply(Boom.wrap(error))
            }
          }

          reply().code(204)
        })
      })
    },
    config: {
      auth: {
        strategy: 'certificate',
        scope: ['admin']
      },
      validate: {
        payload: {
          user: Joi.string().required()
        }
      }
    }
  })

  callback()
}
