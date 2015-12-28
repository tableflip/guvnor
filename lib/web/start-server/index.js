var config = require('../config')
var Hapi = require('hapi')
var async = require('async')
var addStatic = require('./add-static')
var addMoonboots = require('./add-moonboots')
var addWebsocket = require('../websocket')
var addClacks = require('./add-clacks')
var startServer = require('./start-server')
var Good = require('good')
var GoodEnough = require('good-enough')
var INFO = require('good-enough').INFO
var CONTEXT = 'web:start-server:index'

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
    if (error) {
      return callback(error)
    }

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
      server.table().forEach(function (table) {
        table.table.forEach(function (route) {
          server.log([INFO, CONTEXT], route.method.toUpperCase() + ' ' + route.path)
        })
      })

      server.connections.forEach(function (connection) {
        server.log([INFO, CONTEXT], 'Server running at ' + connection.info.uri)
      })

      callback(error)
    })
  })
}
