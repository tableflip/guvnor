var connectToProcess = require('./lib/connect-to-process')
var operations = require('../')
var async = require('async')

module.exports = function removeHeapSnapshot (context, name, id, callback) {
  async.waterfall([
    operations.findProcess.bind(null, context, name),
    connectToProcess.bind(null, context),
    function connectedToProcess (proc, disconnect, next) {
      proc.removeHeapSnapshot(id, function removedHeapSnapshot (error, snapshot) {
        disconnect()
        next(error, snapshot)
      })
    }
  ], callback)
}
