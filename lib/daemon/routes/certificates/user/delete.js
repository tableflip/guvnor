'use strict'

const Joi = require('joi')
const Boom = require('boom')
const fs = require('fs')
const path = require('path')
const config = require('../../../config')
const DEBUG = require('good-enough').DEBUG
const ERROR = require('good-enough').ERROR
const CONTEXT = 'daemon:routes:certificates:user:delete'

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

        const bundleFile = path.join(user.home, '.config', config.DAEMON_NAME, `${user.name}.keys`)

        request.log([DEBUG, CONTEXT], `Removing certificate for user ${user.name} at ${bundleFile}`)

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
