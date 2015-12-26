var connectToProcess = require('./lib/connect-to-process')
var operations = require('../')
var async = require('async')

module.exports = function listHeapSnapshots (context, name, callback) {
  async.waterfall([
    operations.findProcess.bind(null, context, name),
    connectToProcess.bind(null, context),
    function connectedToProcess (proc, disconnect, next) {
      proc.listHeapSnapshots(function listedHeapSnapshots (error, list) {
        disconnect()
        next(error, list)
      })
    }
  ], callback)
}
