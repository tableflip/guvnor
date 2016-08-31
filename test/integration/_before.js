'use strict'

const runner = require('./fixtures/runner')
const commands = require('./fixtures/commands')

runner()
.then((runner) => {
  return commands.stopContainers(runner)
  .then(() => commands.removeContainers(runner))
  .then(() => commands.buildDaemon(runner))
  .then(() => commands.startDaemon(runner))
  .then(id => {
    return commands.takeHeapSnapshot(runner, id)
  })
})
