var EventEmitter = require('wildemitter')
var websocketServer = require('../start-server/create-websocket-server')

var emitter = new EventEmitter()

emitter.on('*', function () {
  var args = Array.prototype.slice.call(arguments)

  // remove the user object
  args.splice(1, 1)

  websocketServer(function (error, socket) {
    if (error) {
      return
    }

    socket.emit.apply(socket, args)
  })
})

module.exports = emitter
