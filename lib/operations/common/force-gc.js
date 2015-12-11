var connectToProcess = require('./lib/connect-to-process')
var operations = require('../')
var async = require('async')

module.exports = function forceGc (user, name, callback) {
  async.waterfall([
    operations.findProcess.bind(null, user, name),
    connectToProcess.bind(null, user),
    function connectedToProcess (proc, disconnect, next) {
      proc.forceGc(function forcedGc (error) {
        disconnect()
        next(error)
      })
    }
  ], callback)
}
