var Hapi = require('hapi')
var routes = require('../routes')
var platformOperations = require('../../platform-operations')
var processOperations = require('../../process-operations')
var Boom = require('boom')
var logger = require('winston')
var findUserWithCertificate = require('../lib/find-user-with-certificate')
var findProcessWithCertificate = require('../lib/find-process-with-certificate')
var async = require('async')
var config = require('../config')

module.exports = function createServer (tls, callback) {
  var server = new Hapi.Server()
  server.connection({
    port: config.HTTPS_PORT,
    tls: {
      key: tls.clientKey,
      cert: tls.certificate,
      ca: tls.serviceCertificate,
      requestCert: true,
      rejectUnauthorized: true
    }
  })

  server.auth.scheme('certificate', function (server, options) {
    return {
      authenticate: function (request, reply) {
        var clientCertificate = request.raw.req.connection.getPeerCertificate()

        async.parallel({
          process: findProcessWithCertificate.bind(null, clientCertificate.fingerprint),
          user: findUserWithCertificate.bind(null, clientCertificate.fingerprint)
        }, function foundUser (error, results) {
          if (error) {
            logger.error(error)

            return reply(Boom.wrap(error))
          }

          var user = results.user || results.process

          if (!user) {
            return reply(Boom.unauthorized(null, 'certificate'))
          }

          logger.debug('%s %s connected', results.user ? 'User' : 'Process', user.name)

          return reply.continue({
            credentials: user
          })
        })
      }
    }
  })

  server.auth.strategy('certificate', 'certificate')
  server.auth.default('certificate')

  routes(server, function (error) {
    if (error) {
      return callback(error)
    }

    Object.keys(platformOperations).forEach(function addServerMethod (key) {
      server.method(key, platformOperations[key])
    })

    Object.keys(processOperations).forEach(function addServerMethod (key) {
      server.method(key, processOperations[key])
    })

    callback(null, server)
  })
}
