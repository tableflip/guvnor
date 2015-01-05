var Autowire = require('wantsit').Autowire,
  winston = require('winston')

var LogAdder = function() {
  this._fileSystem = Autowire
  this._logger = Autowire
  this._daemonLogger = Autowire
}

LogAdder.prototype.afterPropertiesSet = function() {
  // now we have a log directory so add the logger
  this._logger.add(new winston.transports.DailyRotateFile({
    filename: this._fileSystem.getLogDir() + '/boss.log',
    level: 'debug'
  }), null, true)
  this._logger.add(new winston.transports.File({
    filename: this._fileSystem.getLogDir() + '/boss.error.log',
    level: 'error',
    handleExceptions: true
  }), null, true)
  this._logger.add(this._daemonLogger, null, true)
}

module.exports = LogAdder
