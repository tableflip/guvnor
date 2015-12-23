var async = require('async')
var websocketServer = require('../start-server/create-websocket-server')
var uncaughtException = require('./events/uncaught-exception')

module.exports = function registerEventListeners (server, callback) {
  websocketServer(function (error, websocket) {
    if (error) {
      return callback(error, server)
    }

    async.parallel([
      uncaughtException.bind(null, websocket)
    ], function (error) {
      callback(error, server)
    })
  })
}
