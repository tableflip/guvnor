var connectToProcess = require('./lib/connect-to-process')
var operations = require('../')
var async = require('async')

module.exports = function takeHeapSnapshot (context, name, callback) {
  async.waterfall([
    operations.findProcess.bind(null, context, name),
    connectToProcess.bind(null, context),
    function connectedToProcess (proc, disconnect, next) {
      proc.takeHeapSnapshot(function takenHeapSnapshot (error, snapshot) {
        disconnect()
        next(error, snapshot)
      })
    }
  ], callback)
}
