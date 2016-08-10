'use strict'

const logger = require('winston')

module.exports = function done () {
  const args = Array.prototype.slice.call(arguments)
  const reply = args.shift()
  const error = args[0]

  if (error && (error instanceof Error || error.isBoom)) {
    logger.warn(error)
  }

  reply.apply(reply, args)
}
