var connectToProcess = require('./lib/connect-to-process')
var operations = require('../')
var async = require('async')

module.exports = function fetchHeapSnapshot (user, name, id, callback) {
  async.waterfall([
    operations.findProcess.bind(null, user, name),
    connectToProcess.bind(null, user),
    function connectedToProcess (proc, disconnect, next) {
      proc.fetchHeapSnapshot(function fetchedHeapSnapshot (error) {
        disconnect()
        next(error)
      })
    }
  ], callback)
}
