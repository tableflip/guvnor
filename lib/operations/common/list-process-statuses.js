var async = require('async')
var logger = require('winston')
var connectToProcess = require('./lib/connect-to-process')
var operations = require('../')
var PROCESS_STATUS = require('../../common/process-status')

module.exports = function commonListProcessStatuses (user, callback) {
  operations.listProcesses(user, function (error, processes) {
    if (error) {
      return callback(error)
    }

    async.map(processes, function (proc, next) {
      if (proc.status !== 'running') {
        return next(null, proc)
      }

      connectToProcess(user, proc.name, function (error, remote, disconnect) {
        if (error) {
          logger.warn('Error connecting to process ' + proc.name)
          logger.warn(error)

          if (error.code === 'ENOENT') {
            // could not find socket
            error = null
          }

          proc.status = PROCESS_STATUS.UNKNOWN

          return next(error, proc)
        }

        remote.reportStatus(function (error, results) {
          disconnect()

          if (error) {
            if (typeof error === 'string' || error instanceof String) {
              error = new Error(error.trim())
            }

            logger.warn('Error reporting status for process ' + proc.name)
            logger.warn(error)

            proc.status = PROCESS_STATUS.ERROR
          }

          results = results || {}

          for (var key in results) {
            proc[key] = results[key]
          }

          next(null, proc)
        })
      })
    }, callback)
  })
}
