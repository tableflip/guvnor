var allProcesses = require('./all-processes')
var PROCESS_STATUS = require('../../common/process-status')

module.exports = function findProcessStatus (name, callback) {
  allProcesses(function (error, processes) {
    var status = PROCESS_STATUS.UNKNOWN

    if (!error) {
      status = (processes.reduce(function (current, next) {
        if (current) {
          return current
        }

        if (next.name === name) {
          return next
        }
      }, null).pop() || {}).status
    }

    return callback(error, status)
  })
}
