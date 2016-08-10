'use strict'

const async = require('async')
const createDirectories = require('./create-directories')
const createServerCertificate = require('./create-server-certificate')
const createRootCertificate = require('./create-root-certificate')
const loadOrCreateCaCertificate = require('./load-or-create-ca-certificate')
const createRestServer = require('./create-rest-server')
const createWebsocketServer = require('./create-websocket-server')
const createSsdpAdvert = require('./create-ssdp-advert')
const registerEventListeners = require('./register-event-listeners')
const watchProcessLogs = require('./watch-process-logs')
const INFO = require('good-enough').INFO
const CONTEXT = 'daemon:start-server'

module.exports = function startServer (callback) {
  async.waterfall([
    createDirectories,
    loadOrCreateCaCertificate,
    createRootCertificate,
    createServerCertificate,
    createRestServer,
    createWebsocketServer,
    registerEventListeners,
    watchProcessLogs
  ], function (error, server) {
    if (error) {
      return callback(error)
    }

    server.start(function () {
      createSsdpAdvert(server, function (error) {
        if (error) {
          return callback(error)
        }

        server.table().forEach(function (table) {
          table.table.forEach(function (route) {
            server.log([INFO, CONTEXT], `${route.method.toUpperCase()} ${route.path}`)
          })
        })

        server.connections.forEach(function (connection) {
          server.log([INFO, CONTEXT], `Server running at ${connection.info.uri}`)
        })

        callback()
      })
    })
  })
}
