var connectToProcess = require('./lib/connect-to-process')
var operations = require('../')
var async = require('async')

module.exports = function fetchHeapSnapshot (context, name, id, onDetails, onData, callback) {
  async.waterfall([
    operations.findProcess.bind(null, context, name),
    connectToProcess.bind(null, context),
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
