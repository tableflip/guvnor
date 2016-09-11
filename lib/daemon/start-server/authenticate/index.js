'use strict'

const Boom = require('boom')
const authenticateUser = require('./user')
const authenticateProcess = require('./process')
const ERROR = require('good-enough').ERROR
const DEBUG = require('good-enough').DEBUG
const WARN = require('good-enough').WARN
const CONTEXT = 'daemon:start-server:authenticate:index'

module.exports = (tls, request, reply) => {
  request.log([DEBUG, CONTEXT], `Incoming request: ${request.method.toUpperCase()} ${request.path}`)

  request.raw.req.connection.renegotiate({
    key: tls.clientKey,
    cert: tls.certificate,
    ca: tls.serviceCertificate,
    requestCert: true,
    rejectUnauthorized: false
  }, (error) => {
    if (error) {
      request.log([ERROR, CONTEXT], error)

      return reply(Boom.wrap(error))
    }

    const req = request.raw.req

    if (!req.socket.authorized) {
      request.log([WARN, CONTEXT], `Socket was not authorised - ${req.socket.authorizationError}`)
      return reply(Boom.unauthorized('Socket was not authorised', 'certificate'))
    }

    const clientCertificate = req.connection.getPeerCertificate()

    if (!clientCertificate) {
      request.log([WARN, CONTEXT], 'No certificate found')
      return reply(Boom.unauthorized('No certificate found', 'certificate'))
    }

    if (!clientCertificate.fingerprint) {
      request.log([WARN, CONTEXT], 'No certificate fingerprint found')
      return reply(Boom.unauthorized('No certificate fingerprint found', 'certificate'))
    }

    if (clientCertificate.subject.OU === 'user') {
      request.log([DEBUG, CONTEXT], 'User certificate supplied')

      authenticateUser(clientCertificate.subject.CN, clientCertificate.fingerprint)
      .then(user => {
        request.log([DEBUG, CONTEXT], `${user.name} (${user.scope}) connected`)

        reply.continue({
          credentials: user
        })
      })
      .catch(error => {
        request.log([ERROR, CONTEXT], error)

        return reply(Boom.wrap(error))
      })
    } else if (clientCertificate.subject.OU === 'process') {
      request.log([DEBUG, CONTEXT], 'Process certificate supplied')

      authenticateProcess(clientCertificate.subject.CN, clientCertificate.fingerprint)
      .then(user => {
        request.log([DEBUG, CONTEXT], `${user.name} (${user.scope}) connected`)

        reply.continue({
          credentials: user
        })
      })
      .catch(error => {
        request.log([ERROR, CONTEXT], error)

        return reply(Boom.wrap(error))
      })
    } else {
      request.log([WARN, CONTEXT], 'Certificate was not for user or process')
      return reply(Boom.forbidden('Certificate was not for user or process', 'certificate'))
    }
  })
}
