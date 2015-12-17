var connectToProcess = require('./lib/connect-to-process')
var operations = require('../')
var async = require('async')

module.exports = function setNumWorkers (user, name, workers, callback) {
  async.waterfall([
    operations.findProcess.bind(null, user, name),
    connectToProcess.bind(null, user),
    function connectedToProcess (proc, disconnect, next) {
      proc.setNumWorkers(workers, function didSetNumWorkers (error) {
        disconnect()
        next(error)
      })
    }
  ], callback)
}
