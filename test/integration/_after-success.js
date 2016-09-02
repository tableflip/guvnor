'use strict'

const runner = require('./fixtures/runner')
const commands = require('./fixtures/commands')
const winston = require('winston')

if (!process.env.QUIET) {
  winston.level = 'debug'
}

winston.cli()

runner()
.then((runner) => {
  return commands.findContainer(runner)
  .then(id => {
    return commands.takeHeapSnapshot(runner, id)
    .then(() => commands.fetchCoverage(runner, id))
  })
})
