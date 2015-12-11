var async = require('async')
var operations = require('../')
var reportProcessStatus = require('./lib/report-process-status')

module.exports = function launchdFindProcess (user, name, callback) {
  async.waterfall([
    operations.findProcess.bind(null, user, name),
    reportProcessStatus.bind(null, user)
  ], callback)
}
