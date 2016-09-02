'use strict'

const runner = require('./fixtures/runner')
const commands = require('./fixtures/commands')

runner()
.then((runner) => {
  return commands.findContainer(runner)
  .then(id => {
    return commands.takeHeapSnapshot(runner, id)
    .then(() => commands.fetchCoverage(runner, id))
  })
})
