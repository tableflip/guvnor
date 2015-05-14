var logger = require('winston')

module.exports = function done () {
  var args = Array.prototype.slice.call(arguments)
  var reply = args.shift()
  var error = args[0]

  if (error && (error instanceof Error || error.isBoom)) {
    logger.warn(error)
  }

  reply.apply(reply, args)
}
