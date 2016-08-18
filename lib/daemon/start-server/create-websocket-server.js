'use strict'

const socketIO = require('socket.io')
let socket

module.exports = function createWebsocketServer () {
  if (arguments.length === 0) {
    return Promise.resolve(socket)
  } else if (arguments.length === 1) {
    const server = arguments[0]

    socket = socketIO(server.connections[0].listener)

    return Promise.resolve(server)
  }

  return Promise.reject(new Error('Expected zero or one arguments'))
}
