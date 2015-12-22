var connectToProcess = require('./lib/connect-to-process')
var operations = require('../')
var async = require('async')

module.exports = function fetchHeapSnapshot (user, name, id, onDetails, onData, callback) {
  async.waterfall([
    operations.findProcess.bind(null, user, name),
    connectToProcess.bind(null, user),
    function connectedToProcess (proc, disconnect, next) {
      proc.fetchHeapSnapshot(id, onDetails, function (data) {
        onData(new Buffer(data, 'base64'))
      }, function fetchedHeapSnapshot (error) {
        disconnect()

        if (error) {
          var err = new Error(error.message)

          for (var key in error) {
            err[key] = error[key]
          }

          error = err
        }

        next(error)
      })
    }
  ], callback)
}
