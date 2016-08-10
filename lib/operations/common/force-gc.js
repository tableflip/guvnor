'use strict'

const connectToProcess = require('./lib/connect-to-process')
const operations = require('../')
const async = require('async')

module.exports = function forceGc (context, name, callback) {
  async.waterfall([
    operations.findProcess.bind(null, context, name),
    connectToProcess.bind(null, context),
    function connectedToProcess (proc, disconnect, next) {
      proc.forceGc(function forcedGc (error) {
        disconnect()
        next(error)
      })
    }
  ], (error, result) => {
    callback(error, error ? undefined : result)
  })
}
