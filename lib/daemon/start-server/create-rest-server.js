var Hapi = require('hapi')
var config = require('../config')
var routes = require('../routes')
var authenticate = require('./authenticate')
var operations = require('../../operations')
var Good = require('good')
var GoodEnough = require('good-enough')

module.exports = function createServer (tls, callback) {
  var server = new Hapi.Server()
  server.connection({
    port: config.HTTPS_PORT,
    tls: {
      key: tls.clientKey,
      cert: tls.certificate,
      ca: tls.serviceCertificate,
      requestCert: true,
      rejectUnauthorized: false
    },
    routes: {
      cors: true
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
    if (error) {
      return callback(error, server)
    }

    Object.keys(operations).forEach(function addServerMethod (key) {
      server.method(key, operations[key])
    })

    server.register({
      register: Good,
      options: {
        reporters: [{
          reporter: GoodEnough,
          events: {
            error: '*',
            log: '*',
            request: '*',
            response: '*',
            wreck: '*',
            ops: '*'
          }
        }]
      }
    }, function (error) {
      callback(error, server)
    })
  })
}
