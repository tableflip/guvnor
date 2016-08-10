'use strict'

const connectToProcess = require('./lib/connect-to-process')
const operations = require('../')
const async = require('async')

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
  ], (error, result) => {
    callback(error, error ? undefined : result)
  })
}
