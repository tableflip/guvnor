'use strict'

const run = require('./run')

const find = (command) => {
  return run('which', [command])
  .then((stdout) => {
    if (!stdout) {
      throw new Error(`Could not find ${command}`)
    }

    return stdout
  })
}

module.exports = find
