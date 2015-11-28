var async = require('async')
var operations = require('../')
var PROCESS_STATUS = require('../../common/process-status')

module.exports = function ensureNotRunning (user, name, callback) {
  async.waterfall([
    operations.findProcess.bind(null, user, name),
    function isRunning (proc, next) {
      var error

      if (proc.status === PROCESS_STATUS.RUNNING) {
        error = new Error(name + ' is already running!')
        error.code = 'ERUNNING'
      }

      next(error)
    }
  ], callback)
}
