var Joi = require('joi')
var Boom = require('boom')
var logger = require('winston')
var fs = require('fs')
var path = require('path')

module.exports = function routeCreateUserCertificate (server, callback) {
  server.route({
    path: '/certificates/user',
    method: 'DELETE',
    handler: function createUserCertificateHandler (request, reply) {
      request.server.methods.findUserDetails(request.payload.user, function (error, user) {
        if (error) {
          return reply(Boom.wrap(error))
        }

        var bundleFile = path.join(user.home, '.config', 'guvnor', user.name + '.keys')

        logger.debug('Removing certificate for user %s at %s', user.name, bundleFile)

        fs.unlink(bundleFile, function (error) {
          if (error) {
            if (error.code === 'ENOENT') {
              // tried to remove a file that didn't exist
              error = null
            } else {
              logger.error(error)
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
