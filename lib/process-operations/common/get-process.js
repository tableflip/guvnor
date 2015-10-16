var processOperations = require('../')
var logger = require('winston')

module.exports = function launchdGetProcess (user, name, callback) {
  logger.debug('getting process for name', name)

  processOperations.listBasicProcesses(user, function (error, processes) {
    callback(error, (processes || []).filter(function (proc) {
      return proc.name === name
    }).pop())
  })
}
