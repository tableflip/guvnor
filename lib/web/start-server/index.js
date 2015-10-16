var config = require('../config')
var logger = require('winston')
var Hapi = require('hapi')
var async = require('async')
var addStatic = require('./add-static')
var addMoonboots = require('./add-moonboots')
var addWebsocket = require('../websocket')
var addClacks = require('./add-clacks')
var startServer = require('./start-server')

module.exports = function setupServer (callback) {
  var options = {
    address: config.HTTPS_ADDRESS,
    port: config.HTTPS_PORT,
    host: config.HTTPS_HOST
  }

  var server = new Hapi.Server()
  server.connection(options)

  async.series([
    addClacks.bind(null, server),
    addMoonboots.bind(null, server),
    addStatic.bind(null, server),
    startServer.bind(null, server),
    addWebsocket.bind(null, server)
  ], function (error) {
    callback(error, 'Running at ' + server.info.uri)
  })
}
