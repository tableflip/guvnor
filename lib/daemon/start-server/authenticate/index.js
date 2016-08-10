'use strict'

const Boom = require('boom')
const async = require('async')
const authenticateUser = require('./user')
const authenticateProcess = require('./process')
const ERROR = require('good-enough').ERROR
const DEBUG = require('good-enough').DEBUG
const CONTEXT = 'daemon:start-server:authenticate:index'

module.exports = (tls, request, reply) => {
  async.waterfall([
    request.raw.req.connection.renegotiate.bind(request.raw.req.connection, {
      key: tls.clientKey,
      cert: tls.certificate,
      ca: tls.serviceCertificate,
      requestCert: true,
      rejectUnauthorized: true
    }),
    (next) => {
      const req = request.raw.req

      if (!req.socket.authorized) {
        return next(Boom.unauthorized('Socket was not authorised', 'certificate'))
      }

      const clientCertificate = req.connection.getPeerCertificate()

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
  ], (error, user) => {
    if (error) {
      request.log([ERROR, CONTEXT], error)

      return reply(Boom.wrap(error))
    }

    request.log([DEBUG, CONTEXT], `${user.name} (${user.scope}) connected`)

    return reply.continue({
      credentials: user
    })
  })
}
