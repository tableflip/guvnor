'use strict'

const logger = require('winston')
const daemon = require('./daemon')
const stringify = require('json-stringify-safe')
const cli = require('../../../lib/cli')
const EventEmitter = require('events').EventEmitter
const path = require('path')

const DOCKER_FILE_DIRECTORY = path.resolve(path.join(__dirname, '..', '..', '..'))

module.exports = daemon
.then(result => (args, piped) => {
  logger.debug(`CLI running ${args}`)

  const command = ['docker', 'exec', '-t', result.id, args]

  return result.runner(command, {
    cwd: DOCKER_FILE_DIRECTORY
  })
})
