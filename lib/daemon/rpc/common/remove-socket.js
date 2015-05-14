var fs = require('fs')
var debug = require('debug')('daemon:rpc:common:remove-socket')

module.exports = function removeSocket(socket, callback) {
  var remove = function () {
    if (fs.existsSync(socket)) {
      debug('Removing socket', socket)
      fs.unlinkSync(socket)
    }
  }

  process.on('exit', remove)
  process.on('uncaughtException', remove)
  process.on('SIGINT', remove)
  process.on('SIGABRT', remove)
  process.on('SIGTERM', remove)

  remove()
  callback()
}
