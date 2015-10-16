var platformOperations = require('../../platform-operations')
var processOperations = require('../../process-operations')
var Boom = require('boom')
var logger = require('winston')
var async = require('async')
var config = require('../config')
var stringify = require('json-stringify-safe')

module.exports = function (request, reply) {
  async.waterfall([
    request.raw.req.connection.renegotiate.bind(request.raw.req.connection, {
      key: tls.clientKey,
      cert: tls.certificate,
      ca: tls.serviceCertificate,
      requestCert: true,
      rejectUnauthorized: true
    }),
    function (next) {
      var req = request.raw.req

      if (!req.socket.authorized) {
        return next(Boom.unauthorized('Socket was not authorised', 'certificate'))
      }

      var clientCertificate = req.connection.getPeerCertificate()

      if (!clientCertificate) {
        return next(Boom.unauthorized('No certificate found', 'certificate'))
      }

      if (!clientCertificate.fingerprint) {
        return next(Boom.unauthorized('No certificate fingerprint found', 'certificate'))
      }

      if (clientCertificate.subject.OU === 'user') {
        platformOperations.findUserDetails(clientCertificate.subject.OU, function (error, user) {
          if (error) {
            return next(Boom.wrap(error))
          }

          if (user.fingerprint !== clientCertificate.fingerprint) {
            return next(Boom.unauthorized('Invalid certificate', 'certificate'))
          }

          user.scope = 'user'

          if (user.name === 'root') {
            user.scope = 'admin'
          }

          return next(null, user)
        })
      } else if (clientCertificate.subject.OU === 'process') {
        async.waterfall([
          processOperations.listBasicProcesses,
          function filterProcesses (processes, next) {
            var error
            var proc = processes.filter(function (proc) {
              return proc.name === clientCertificate.subject.CommonName
            }).pop()

            if (!proc) {
              error = Boom.unauthorized('No process found', 'certificate')
            }

            next(error, proc)
          },
          function (proc, next) {
            pem.getFingerprint(proc.env.GUVNOR_CERT, function (error, fingerprint) {
              if (error) {
                logger.warn(proc.name, 'had an invalid certificate')
                return next(error)
              }

              if (fingerprint.fingerprint !== clientCertificate.fingerprint) {
                return next(Boom.unauthorized('Invalid certificate', 'certificate'))
              }

              proc.scope = 'process'

              return next(null, proc)
            })
          }
        ], next)
      } else {
        return next(Boom.unauthorized('Certificate was not for user or process', 'certificate'))
      }
    }
  ], function (error, user) {
    if (error) {
      logger.error(error)

      return reply(Boom.wrap(error))
    }

    logger.debug('%s %s connected', results.user ? 'User' : 'Process', user.name)

    return reply.continue({
      credentials: user
    })
  })
}
