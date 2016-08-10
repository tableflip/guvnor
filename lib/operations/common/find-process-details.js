'use strict'

const async = require('async')
const operations = require('../')
const reportProcessStatus = require('./lib/report-process-status')

module.exports = function launchdFindProcess (context, name, callback) {
  async.waterfall([
    operations.findProcess.bind(null, context, name),
    reportProcessStatus.bind(null, context)
  ], (error, result) => {
    callback(error, error ? undefined : result)
  })
}
