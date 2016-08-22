'use strict'

const Boom = require('boom')
const authenticateUser = require('./user')
const authenticateProcess = require('./process')
const ERROR = require('good-enough').ERROR
const DEBUG = require('good-enough').DEBUG
const INFO = require('good-enough').INFO
const CONTEXT = 'daemon:start-server:authenticate:index'

module.exports = (tls, request, reply) => {
  request.log([INFO, CONTEXT], `Incoming request: ${request.method.toUpperCase()} ${request.path}`)

  request.raw.req.connection.renegotiate({
    key: tls.clientKey,
    cert: tls.certificate,
    ca: tls.serviceCertificate,
    requestCert: true,
    rejectUnauthorized: true
  }, (error) => {
    if (error) {
      request.log([ERROR, CONTEXT], error)

      return reply(Boom.wrap(error))
    }

    const req = request.raw.req

    if (!req.socket.authorized) {
      return reply(Boom.unauthorized('Socket was not authorised', 'certificate'))
    }

    const clientCertificate = req.connection.getPeerCertificate()

    if (!clientCertificate) {
      return reply(Boom.unauthorized('No certificate found', 'certificate'))
    }

    if (!clientCertificate.fingerprint) {
      return reply(Boom.unauthorized('No certificate fingerprint found', 'certificate'))
    }

    if (clientCertificate.subject.OU === 'user') {
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
      return reply(Boom.unauthorized('Certificate was not for user or process', 'certificate'))
    }
  })
}
