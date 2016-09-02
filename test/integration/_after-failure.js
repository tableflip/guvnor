'use strict'

if (process.env.QUIET) {
  return
}

const runner = require('./fixtures/runner')
const commands = require('./fixtures/commands')
const winston = require('winston')
winston.level = 'debug'
winston.cli()
winston.error('---- Tests failed! ----')
winston.error('')

runner()
.then((runner) => {
  return commands.findContainer(runner)
  .then(id => commands.printLogs(runner, id))
  // make sure we still register as a build failure
  .then(() => process.exit(1))
})
