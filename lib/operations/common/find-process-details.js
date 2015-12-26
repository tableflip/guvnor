var async = require('async')
var operations = require('../')
var reportProcessStatus = require('./lib/report-process-status')

module.exports = function launchdFindProcess (context, name, callback) {
  async.waterfall([
    operations.findProcess.bind(null, context, name),
    reportProcessStatus.bind(null, context)
  ], callback)
}
