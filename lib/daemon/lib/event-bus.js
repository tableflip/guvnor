var os = require('os')
var EventEmitter = require('wildemitter')
var websocketServer = require('../start-server/create-websocket-server')

var emitter = new EventEmitter()

emitter.on('*', function () {
  var args = Array.prototype.slice.call(arguments)

  // replace the user object with our host name
  args[1] = os.hostname()

  websocketServer((error, io) => {
    if (error) {
      return
    }

    io.sockets.emit.apply(io.sockets, args)
  })
})

module.exports = emitter
