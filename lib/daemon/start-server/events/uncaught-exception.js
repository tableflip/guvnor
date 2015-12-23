var processStatistics = require('../../lib/process-statistics')
var logger = require('winston')

module.exports = function (websocketServer, callback) {
  websocketServer.on('process:uncaught-exception', function (process, exception) {
    processStatistics(process.name, function (error, stats) {
      if (error) {
        return logger.warn('Could not find process statistics for ', process.name, error)
      }

      stats.exceptions.push(exception)
    })
  })

  callback()
}
