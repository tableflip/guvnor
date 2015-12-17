var connectToProcess = require('./lib/connect-to-process')
var operations = require('../')
var async = require('async')

module.exports = function listHeapSnapshots (user, name, callback) {
  async.waterfall([
    operations.findProcess.bind(null, user, name),
    connectToProcess.bind(null, user),
    function connectedToProcess (proc, disconnect, next) {
      proc.listHeapSnapshots(function listedHeapSnapshots (error, list) {
        disconnect()
        next(error, list)
      })
    }
  ], callback)
}
