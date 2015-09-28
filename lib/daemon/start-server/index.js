var async = require('async')
var logger = require('winston')
var createDirectories = require('./create-directories')
var createServerCertificate = require('./create-server-certificate')
var createRootCertificate = require('./create-root-certificate')
var loadOrCreateCaCertificate = require('./load-or-create-ca-certificate')
var createRestServer = require('./create-rest-server')
var createWebsocketServer = require('./create-websocket-server')

module.exports = function startServer (callback) {
  async.waterfall([
    createDirectories,
    loadOrCreateCaCertificate,
    createRootCertificate,
    createServerCertificate,
    createRestServer,
    createWebsocketServer
  ], function (error, server) {
    if (error) {
      return callback(error)
    }

    server.start(function () {
      logger.debug('REST API running at', server.connections[0].info.uri)

      callback()
    })
  })
}
