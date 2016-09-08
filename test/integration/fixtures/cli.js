'use strict'

const logger = require('winston')
const daemon = require('./daemon')
const stringify = require('json-stringify-safe')
const cli = require('../../../lib/cli')
const EventEmitter = require('events').EventEmitter

module.exports = daemon
.then(credentials => (args, piped) => {
  args = `/path/to/node ${args}`

  logger.debug(`CLI running ${args}`)

  return cli(credentials, args, piped)
  .then(stdout => {
    logger.debug(`CLI output: ${stdout}`)

    return stdout
  })
  .catch(error => {
    if (error.code !== 'OVERRIDDEN') {
      logger.error(`CLI error: ${error.stack}`)
    }

    throw error
  })
})
