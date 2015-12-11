var connectToProcess = require('./lib/connect-to-process')
var operations = require('../')
var async = require('async')

module.exports = function takeHeapSnapshot (user, name, callback) {
  async.waterfall([
    operations.findProcess.bind(null, user, name),
    connectToProcess.bind(null, user),
    function connectedToProcess (proc, disconnect, next) {
      proc.takeHeapSnapshot(function takenHeapSnapshot (error, snapshot) {
        disconnect()
        next(error, snapshot)
      })
    }
  ], callback)
}
