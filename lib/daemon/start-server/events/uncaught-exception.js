'use strict'

const shortid = require('shortid')
const processStatistics = require('../../lib/process-statistics')
const WARN = require('good-enough').WARN
const CONTEXT = 'daemon:start-server-events:uncaught-exception'
const MAX_EXCEPTIONS = 20

module.exports = function (server, bus) {
  bus.on('process:uncaught-exception', function (user, proc, exception) {
    processStatistics({
      user: user,
      log: server.log.bind(server)
    }, proc.name, function (error, stats) {
      if (error) {
        server.log([WARN, CONTEXT], `Could not find process statistics for ${proc.name}`)
        server.log([WARN, CONTEXT], error)

        return
      }

      exception.id = shortid.generate()

      if (stats.exceptions.length === MAX_EXCEPTIONS) {
        // discard oldest
        stats.exceptions.shift()
      }

      stats.exceptions.push(exception)
    })
  })
}
