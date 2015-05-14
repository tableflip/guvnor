var allProcesses = require('./all-processes')
var logger = require('winston')

module.exports = function isProcessRunning (name, callback) {
  allProcesses(function (error, processes) {
    if (error) {
      return callback(error)
    }

    var running = processes.some(function (proc) {
      if (proc.name === name && proc.pid) {
        return true
      }

      return false
    })

    logger.debug('%s running %s', name, running)
    callback(null, running)
  })
}
