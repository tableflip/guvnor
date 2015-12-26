var Joi = require('joi')
var Boom = require('boom')
var async = require('async')
var caCertificate = require('../../../lib/ca-certificate')
var createUserCertificate = require('../../../lib/create-user-certificate')
var DEBUG = require('good-enough').DEBUG
var ERROR = require('good-enough').ERROR
var CONTEXT = 'daemon:routes:certificates:user:post'

module.exports = function routeCreateUserCertificate (server, callback) {
  server.route({
    path: '/certificates/user',
    method: 'POST',
    handler: function createUserCertificateHandler (request, reply) {
      async.auto({
        ca: function (next) {
          caCertificate(next)
        },
        user: function (next) {
          request.server.methods.findUserDetails({
            user: request.auth.credentials,
            log: request.log.bind(request)
          }, request.payload.user, next)
        },
        create: ['ca', 'user', function (next, results) {
          if (!results.user) {
            var error = new Error('Unknown user')
            error.code = 'ENOUSER'

            return next(error)
          }

          request.log([DEBUG, CONTEXT], 'Creating certificate for user ' + results.user.name)
          createUserCertificate(results.ca, results.user, next)
        }]
      }, function (error, results) {
        if (error) {
          if (error.code === 'EENT') {
            return reply(Boom.conflict('Key already exists'))
          }

          if (error.code === 'ENOUSER') {
            return reply(Boom.preconditionFailed('Unknown user'))
          }

          return reply(Boom.wrap(error))
        }

        reply(error, results.create)
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
