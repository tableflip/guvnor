var operations = require('../../../operations')
var Boom = require('boom')
var async = require('async')
var authenticateUser = require('./user')
var authenticateProcess = require('./process')
var ERROR = require('good-enough').ERROR
var DEBUG = require('good-enough').DEBUG
var CONTEXT = 'daemon:start-server:authenticate:index'

module.exports = function (tls, request, reply) {
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
        authenticateUser(clientCertificate.subject.CN, clientCertificate.fingerprint, next)
      } else if (clientCertificate.subject.OU === 'process') {
        authenticateProcess(clientCertificate.subject.CN, clientCertificate.fingerprint, next)
      } else {
        return next(Boom.unauthorized('Certificate was not for user or process', 'certificate'))
      }
    }
  ], function (error, user) {
    if (error) {
      request.log([ERROR, CONTEXT], error)

      return reply(Boom.wrap(error))
    }

    request.log([DEBUG, CONTEXT], user.name + ' (' + user.scope + ') connected')

    return reply.continue({
      credentials: user
    })
  })
}
