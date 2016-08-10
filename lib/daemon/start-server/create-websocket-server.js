'use strict'

const socketIO = require('socket.io')
let socket

module.exports = function createWebsocketServer () {
  const callback = arguments[arguments.length - 1]

  if (arguments.length === 1) {
    callback(null, socket)
  } else if (arguments.length === 2) {
    const server = arguments[0]

    socket = socketIO(server.connections[0].listener)

    callback(null, server)
  } else {
    callback(new Error('Expected one or two arguments'))
  }
}
