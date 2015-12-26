var shortid = require('shortid')
var processStatistics = require('../../lib/process-statistics')
var WARN = require('good-enough').WARN
var CONTEXT = 'daemon:start-server-events:uncaught-exception'

module.exports = function (server, bus, callback) {
  bus.on('process:uncaught-exception', function (user, proc, exception) {
    processStatistics({
      user: user,
      log: server.log.bind(server)
    }, proc.name, function (error, stats) {
      if (error) {
        server.log([WARN, CONTEXT], 'Could not find process statistics for ' + proc.name)
        server.log([WARN, CONTEXT], error)

        return
      }

      exception.id = shortid.generate()

      stats.exceptions.push(exception)
    })
  })

  callback()
}
