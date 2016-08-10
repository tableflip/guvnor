'use strict'

const os = require('os')
const EventEmitter = require('wildemitter')
const websocketServer = require('../start-server/create-websocket-server')

const emitter = new EventEmitter()

emitter.on('*', function () {
  const args = Array.prototype.slice.call(arguments)

  // replace the user object with our host name
  args[1] = os.hostname()

  console.info('emitting', args)

  websocketServer((error, io) => {
    if (error) {
      return
    }

    io.sockets.emit.apply(io.sockets, args)
  })
})

module.exports = emitter
