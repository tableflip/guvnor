'use strict'

const connectToProcess = require('./lib/connect-to-process')
const operations = require('../')
const async = require('async')

module.exports = function setNumWorkers (context, name, workers, callback) {
  async.waterfall([
    operations.findProcess.bind(null, context, name),
    connectToProcess.bind(null, context),
    function connectedToProcess (proc, disconnect, next) {
      proc.setNumWorkers(workers, function didSetNumWorkers (error) {
        disconnect()
        next(error)
      })
    }
  ], (error, result) => {
    callback(error, error ? undefined : result)
  })
}
