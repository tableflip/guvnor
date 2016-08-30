'use strict'

const createDirectories = require('./create-directories')
const createServerCertificate = require('./create-server-certificate')
const createRootCertificate = require('./create-root-certificate')
const loadOrCreateCaCertificate = require('../lib/ca-certificate')
const createRestServer = require('./create-rest-server')
const createWebsocketServer = require('./create-websocket-server')
const createSsdpAdvert = require('./create-ssdp-advert')
const registerEventListeners = require('./register-event-listeners')
const watchProcessLogs = require('./watch-process-logs')
const context = require('../lib/global-context')
const INFO = require('good-enough').INFO
const CONTEXT = 'daemon:start-server'

module.exports = function startServer () {
  return context()
  .then(context => {
    return createDirectories(context)
    .then(() => loadOrCreateCaCertificate(context))
    .then(ca => Promise.all([
      createRootCertificate(context, ca),
      createServerCertificate(context, ca)
    ]))
    .then(certs => createRestServer(context, certs[1]))
    .then(server => {
      return Promise.all([
        createWebsocketServer(context, server),
        registerEventListeners(context, server),
        watchProcessLogs(context, server)
      ])
      .then(() => new Promise((resolve, reject) => {
        server.start(resolve)
      })
      .then(() => createSsdpAdvert(context, server))
      .then(() => {
        server.table().forEach(function (table) {
          table.table.forEach(function (route) {
            server.log([INFO, CONTEXT], `${route.method.toUpperCase()} ${route.path}`)
          })
        })

        server.connections.forEach(function (connection) {
          server.log([INFO, CONTEXT], `Server running at ${connection.info.uri}`)
        })
      }))
      .then(() => server)
    })
  })
}
