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
const INFO = require('good-enough').INFO
const CONTEXT = 'daemon:start-server'

module.exports = function startServer () {
  return createDirectories()
  .then(() => loadOrCreateCaCertificate)
  .then((ca) => Promise.all([
    createRootCertificate(ca),
    createServerCertificate(ca)
  ]))
  .then((certs) => createRestServer(certs[1]))
  .then(() => createWebsocketServer())
  .then((server) => registerEventListeners(server))
  .then((server) => watchProcessLogs(server))
  .then(server => {
    return new Promise((resolve, reject) => {
      server.start(resolve)
    })
    .then(server => createSsdpAdvert(server))
    .then(() => {
      server.table().forEach(function (table) {
        table.table.forEach(function (route) {
          server.log([INFO, CONTEXT], `${route.method.toUpperCase()} ${route.path}`)
        })
      })

      server.connections.forEach(function (connection) {
        server.log([INFO, CONTEXT], `Server running at ${connection.info.uri}`)
      })
    })
  })
}
