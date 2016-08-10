'use strict'

const connectToProcess = require('./lib/connect-to-process')
const operations = require('../')
const async = require('async')

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
          const err = new Error(error.message)

          for (const key in error) {
            err[key] = error[key]
          }

          error = err
        }

        next(error)
      })
    }
  ], (error, result) => {
    callback(error, error ? undefined : result)
  })
}
