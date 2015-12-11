var dnode = require('boss-dnode')
var logger = require('winston')

module.exports = function connectToProcess (user, proc, callback) {
  var socket = proc.socket

  logger.debug('Connecting to', proc)

  var d

  try {
    d = dnode.connect(socket)
  } catch (error) {
    return callback(error)
  }

  d.on('error', function (error) {
    if (callback) {
      callback(error)
      callback = null
    }

    logger.warn(error)
  })
  d.on('remote', function (remote) {
    if (!callback) {
      // would have emitted error event
      return
    }

    callback(null, remote, d.end.bind(d))
  })
}
