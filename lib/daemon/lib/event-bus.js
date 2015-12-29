var os = require('os')
var EventEmitter = require('wildemitter')
var websocketServer = require('../start-server/create-websocket-server')

var emitter = new EventEmitter()

emitter.on('*', function () {
  var args = Array.prototype.slice.call(arguments)

  // replace the user object with our host name
  args[1] = os.hostname()

  websocketServer((error, socket) => {
    if (error) {
      return
    }

    socket.emit.apply(socket, args)
  })
})

module.exports = emitter
