var DEBUG = require('good-enough').DEBUG
var CONTEXT = 'web:start-server:start-static'

module.exports = function startServer (server, callback) {
  server.log([DEBUG, CONTEXT], 'Starting server')

  server.start(function () {
    callback()
  })
}
