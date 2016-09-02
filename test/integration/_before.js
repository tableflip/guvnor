'use strict'

const runner = require('./fixtures/runner')
const commands = require('./fixtures/commands')
const winston = require('winston')

if (!process.env.QUIET) {
  winston.level = 'debug'
}

winston.cli()

runner()
.then(runner => {
  return commands.removeCoverageDirectory()
  .then(() => commands.stopContainers(runner))
  .then(() => commands.removeContainers(runner))
  .then(() => commands.buildDaemon(runner))
  .then(() => commands.startDaemon(runner))
  .then(id => commands.takeHeapSnapshot(runner, id))
})
