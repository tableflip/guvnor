var socketIO = require('socket.io')
var logger = require('winston')
var socket

module.exports = function createWebsocketServer () {
  var callback = arguments[arguments.length - 1]

  if (arguments.length === 1) {
    logger.debug('Returning websocket server')
    callback(null, socket)
  } else if (arguments.length === 2) {
    logger.debug('Creating websocket server')
    var server = arguments[0]

    socket = socketIO(server.listener)

    callback(null, server)
  } else {
    callback(new Error('Expected one or two arguments'))
  }
}
