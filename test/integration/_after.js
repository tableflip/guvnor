'use strict'

process.on('uncaughtException', error => {
  console.error(error.stack)

  process.exit(1)
})

process.on('unhandledRejection', error => {
  console.error(error.stack)

  process.exit(1)
})

const runner = require('./fixtures/runner')
const commands = require('./fixtures/commands')

runner()
.then((runner) => {
  return commands.findContainer(runner)
  .then(id => {
    return commands.takeHeapSnapshot(runner, id)
    .then(() => commands.printLogs(runner, id))
    .then(() => commands.fetchCoverage(runner, id))
  })
})
