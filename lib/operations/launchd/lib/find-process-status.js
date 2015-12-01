var allProcesses = require('./all-processes')
var PROCESS_STATUS = require('../../../common/process-status')

module.exports = function launchdFindProcessStatus (name, callback) {
  allProcesses(function (error, processes) {
    if (error) {
      return callback(error)
    }

    var proc = processes.filter(function (proc) {
      return proc.name === name
    }).pop()

    if (!proc) {
      return callback()
    }

    var status = PROCESS_STATUS.UNKNOWN

    if (proc.pid === 0) {
      status = PROCESS_STATUS.STOPPED
    }

    if (proc.exitCode < 0) {
      status = PROCESS_STATUS.ERROR
    }

    if (proc.pid > 0) {
      status = PROCESS_STATUS.RUNNING
    }

    callback(null, status)
  })
}
