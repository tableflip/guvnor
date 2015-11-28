var connectToProcess = require('../connect-to-process')

module.exports = function fetchHeapSnapshot (user, name, id, callback) {
  connectToProcess(user, name, function connectedToProcess (error, proc, disconnect) {
    if (error) {
      return callback(error)
    }

    proc.fetchHeapSnapshot(id, function fetchedHeapSnapshot (error) {
      disconnect()
      callback(error)
    })
  })
}
