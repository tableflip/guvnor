'use strict'

const async = require('async')
const operations = require('../../')
const PROCESS_STATUS = require('../../../common/process-status')

module.exports = function ensureNotRunning (context, name, callback) {
  async.waterfall([
    operations.findProcess.bind(null, context, name),
    function isRunning (proc, next) {
      let error

      if (proc && proc.status === PROCESS_STATUS.RUNNING) {
        error = new Error(`${name} is already running!`)
        error.code = 'ERUNNING'
      }

      next(error)
    }
  ], callback)
}
