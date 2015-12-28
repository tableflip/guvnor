var async = require('async')
var createDirectories = require('./create-directories')
var createServerCertificate = require('./create-server-certificate')
var createRootCertificate = require('./create-root-certificate')
var loadOrCreateCaCertificate = require('./load-or-create-ca-certificate')
var createRestServer = require('./create-rest-server')
var createWebsocketServer = require('./create-websocket-server')
var createSsdpAdvert = require('./create-ssdp-advert')
var registerEventListeners = require('./register-event-listeners')
var watchProcessLogs = require('./watch-process-logs')
var INFO = require('good-enough').INFO
var CONTEXT = 'daemon:start-server'

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
            server.log([INFO, CONTEXT], route.method.toUpperCase() + ' ' + route.path)
          })
        })

        server.connections.forEach(function (connection) {
          server.log([INFO, CONTEXT], 'Server running at ' + connection.info.uri)
        })

        callback()
      })
    })
  })
}
