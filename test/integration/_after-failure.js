'use strict'

const runner = require('./fixtures/runner')
const commands = require('./fixtures/commands')

if (process.env.QUIET) {
  return
}

console.info('---- Tests failed! ----')
console.info('')

runner()
.then((runner) => {
  return commands.findContainer(runner)
  .then(id => commands.printLogs(runner, id))
  // make sure we still register as a build failure
  .then(() => process.exit(1))
})
