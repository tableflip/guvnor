var connectToProcess = require('../connect-to-process')

module.exports = function takeHeapSnapshot (user, name, callback) {
  connectToProcess(user, name, function connectedToProcess (error, proc, disconnect) {
    if (error) {
      return callback(error)
    }

    proc.takeHeapSnapshot(function takenHeapSnapshot (error, snapshot) {
      disconnect()
      callback(error, snapshot)
    })
  })
}
