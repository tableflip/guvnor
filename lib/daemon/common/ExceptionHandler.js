var Autowire = require('wantsit').Autowire

var ExceptionHandler = function() {
  this._logger = Autowire
  this._parentProcess = Autowire
}

ExceptionHandler.prototype.afterPropertiesSet = function() {
  process.on('uncaughtException', this._onUncaughtException.bind(this))
}

ExceptionHandler.prototype._onUncaughtException = function(error) {
  this._parentProcess.send('process:uncaughtexception', {
    message: error.message,
    code: error.code,
    stack: error.stack,
    date: Date.now()
  })

  if(process.listeners('uncaughtException').length == 1) {
    this._parentProcess.send('process:fatality')

    process.nextTick(process.exit.bind(process, 1))
  }
}

module.exports = ExceptionHandler
