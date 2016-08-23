'use strict'

const os = require('os')
const EventEmitter = require('wildemitter')
const websocketServer = require('../start-server/create-websocket-server')

const emitter = new EventEmitter()

emitter.on('*', function () {
  const args = Array.prototype.slice.call(arguments)

  // replace the user object with our host name
  args[1] = os.hostname()

  websocketServer()
  .then(io => io.sockets.emit.apply(io.sockets, args))
  .catch(error => console.error(error))
})

module.exports = emitter
