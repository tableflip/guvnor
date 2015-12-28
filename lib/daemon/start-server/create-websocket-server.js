var socketIO = require('socket.io')
var socket

module.exports = function createWebsocketServer () {
  var callback = arguments[arguments.length - 1]

  if (arguments.length === 1) {
    callback(null, socket)
  } else if (arguments.length === 2) {
    var server = arguments[0]

    socket = socketIO(server.connections[0].listener)

    callback(null, server)
  } else {
    callback(new Error('Expected one or two arguments'))
  }
}
