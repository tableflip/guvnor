var connectToProcess = require('../connect-to-process')

module.exports = function removeHeapSnapshot (user, name, id, callback) {
  connectToProcess(user, name, function connectedToProcess (error, proc, disconnect) {
    if (error) {
      return callback(error)
    }

    proc.removeHeapSnapshot(id, function removedHeapSnapshot (error) {
      disconnect()
      callback(error)
    })
  })
}
