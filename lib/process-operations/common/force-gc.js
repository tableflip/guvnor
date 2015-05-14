var connectToProcess = require('./connect-to-process')

module.exports = function forceGc (user, name, callback) {

  connectToProcess(user, name, function connectedToProcess (error, proc, disconnect) {
    if (error) {
      return callback(error)
    }

    proc.forceGc(function forcedGc (error) {
      disconnect()
      callback(error)
    })
  })
}
