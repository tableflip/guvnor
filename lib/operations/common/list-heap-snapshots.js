var connectToProcess = require('./connect-to-process')

module.exports = function listHeapSnapshots (user, name, callback) {

  connectToProcess(user, name, function connectedToProcess (error, proc, disconnect) {
    if (error) {
      return callback(error)
    }

    proc.listHeapSnapshots(function listedHeapSnapshots (error, list) {
      disconnect()
      callback(error, list)
    })
  })
}
