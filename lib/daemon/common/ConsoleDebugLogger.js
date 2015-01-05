var util = require('util'),
  Console = require('winston').transports.Console

/**
 * A logger intended for use with child processes - if process.send
 * is not defined then something has gone wrong so this logger will
 * print the log message to the console instead of just swallowing it.
 */
var ConsoleDebugLogger = function(options) {
  Console.call(this, options)
}
util.inherits(ConsoleDebugLogger, Console)

ConsoleDebugLogger.prototype.log = function (level, msg, meta, callback) {
  if(this.silent || process.send) {
    return callback(null, true)
  }

  Console.prototype.log.apply(this, arguments)
}

module.exports = ConsoleDebugLogger
