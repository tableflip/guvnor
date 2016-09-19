'use strict'

const Hapi = require('hapi')
const config = require('../config')
const routes = require('../routes')
const plugins = require('../plugins')
const authenticate = require('./authenticate')
const operations = require('../../operations')
const Good = require('good')

const createServer = (context, tls) => {
  return new Promise((resolve, reject) => {
    const server = new Hapi.Server()
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
        cors: {
          credentials: true
        }
      },
      labels: ['api']
    })
    server.connection({
      port: config.HTTP_PORT,
      labels: ['http']
    })

    server.auth.scheme('certificate', (server, options) => {
      return {
        authenticate: authenticate.bind(null, tls)
      }
    })
    server.auth.strategy('certificate', 'certificate')
    server.auth.default('certificate')

    return routes(server)
    .then(() => plugins(server))
    .then(() => {
      Object.keys(operations).forEach((key) => {
        server.method(key, operations[key])
      })

      server.register({
        register: Good,
        options: {
          reporters: {
            enough: [{
              module: 'good-enough',
              args: [{
                events: {
                  error: '*',
                  log: '*',
                  request: '*',
                  response: '*',
                  wreck: '*',
                  ops: '*'
                }
              }]
            }]
          }
        }
      }, (error) => {
        if (error) {
          return reject(error)
        }

        return resolve(server)
      })
    })
  })
}

module.exports = createServer
