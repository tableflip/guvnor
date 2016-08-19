'use strict'

const shortid = require('shortid')
const processStatistics = require('../../lib/process-statistics')
const WARN = require('good-enough').WARN
const CONTEXT = 'daemon:start-server-events:unhandled-rejection'

module.exports = function (server, bus) {
  bus.on('process:unhandled-rejection', function (user, proc, rejection) {
    processStatistics({
      user: user,
      log: server.log.bind(server)
    }, proc.name, function (error, stats) {
      if (error) {
        server.log([WARN, CONTEXT], `Could not find process statistics for ${proc.name}`)
        server.log([WARN, CONTEXT], error)

        return
      }

      rejection.id = shortid.generate()

      stats.exceptions.push(rejection)
    })
  })
}
