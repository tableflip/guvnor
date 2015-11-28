var operations = require('../')
var PROCESS_STATUS = require('../../common/process-status')

module.exports = function ensureNotRunning (user, app, callback) {
  operations.findProcess(user, app.name, function (error, proc) {
    if (error) {
      error = null
    }

    if (proc && proc.status === PROCESS_STATUS.RUNNING) {
      error = new Error(app.name + ' is running')
      error.code = 'ERUNNING'
    }

    callback(error, app)
  })
}
