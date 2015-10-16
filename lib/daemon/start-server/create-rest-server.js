var Hapi = require('hapi')
var config = require('../config')
var routes = require('../routes')
var authenticate = require('./authenticate')
var platformOperations = require('../../platform-operations')
var processOperations = require('../../process-operations')

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
      authenticate: authenticate.bind(null, tls)
    }
  })
  server.auth.strategy('certificate', 'certificate')
  server.auth.default('certificate')

  routes(server, function (error) {
    Object.keys(platformOperations).forEach(function addServerMethod (key) {
      server.method(key, platformOperations[key])
    })

    Object.keys(processOperations).forEach(function addServerMethod (key) {
      server.method(key, processOperations[key])
    })

    callback(error, server)
  })
}
