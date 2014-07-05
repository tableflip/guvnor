var Autowire = require('wantsit').Autowire

var ExceptionHandler = function() {
  this._logger = Autowire
  this._parentProcess = Autowire
}

ExceptionHandler.prototype.afterPropertiesSet = function() {
  process.on('uncaughtException', this._onUncaughtException.bind(this))
}

ExceptionHandler.prototype._onUncaughtException = function(error) {
  this._logger.error('uncaughtException', error)
  this._parentProcess.send({
    type: 'process:uncaughtexception',
    error: {
      type: error.type,
      stack: error.stack,
      arguments: error.arguments,
      message: error.message
    }
  })

  if(process.listeners('uncaughtException').length == 1) {
    process.nextTick(function() {
      this._parentProcess.send({type: 'daemon:fatality', message: 'No handlers for uncaught exception'})

      process.exit(1)
    }.bind(this))
  }
}

module.exports = ExceptionHandler
