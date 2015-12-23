var async = require('async')
var logger = require('winston')
var createDirectories = require('./create-directories')
var createServerCertificate = require('./create-server-certificate')
var createRootCertificate = require('./create-root-certificate')
var loadOrCreateCaCertificate = require('./load-or-create-ca-certificate')
var createRestServer = require('./create-rest-server')
var createWebsocketServer = require('./create-websocket-server')
var createSsdpAdvert = require('./create-ssdp-advert')
var registerEventListeners = require('./register-event-listeners')

module.exports = function startServer (callback) {
  async.waterfall([
    createDirectories,
    loadOrCreateCaCertificate,
    createRootCertificate,
    createServerCertificate,
    createRestServer,
    createSsdpAdvert,
    createWebsocketServer,
    registerEventListeners
  ], function (error, server) {
    if (error) {
      return callback(error)
    }

    server.start(function () {
      server.table().forEach(function (table) {
        table.table.forEach(function (route) {
          logger.debug(route.method.toUpperCase() + ' ' + route.path)
        })
      })

      server.connections.forEach(function (connection) {
        logger.debug('Server running at ' + connection.info.uri)
      })

      callback()
    })
  })
}
