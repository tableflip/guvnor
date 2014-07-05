var extend = require('extend'),
  winston = require('winston')

function ProcessInfo(script, process, options, fileSystem) {
  this.script = script
  this.process = process
  this.options = extend({
    restartOnError: true,
    restartRetries: 5,
    crashRecoveryPeriod: 5000
  }, options)

  this.restarts = 0
  this.totalRestarts = 0
  this._crashRecoveryTimeoutId = null

  fileSystem.findOrCreateLogFileDirectory(function(error, logFileDirecotry) {
    this.logger = new winston.Logger({
      transports: [
        new winston.transports.DailyRotateFile({
          filename: logFileDirecotry + '/' + options.name + '.log'
        })
      ]
    })
  }.bind(this))
}

ProcessInfo.prototype.stillCrashing = function() {
  clearTimeout(this._crashRecoveryTimeoutId)

  this.restarts++
  this.totalRestarts++

  // Reset the restart count when process considered not crashing
  this._crashRecoveryTimeoutId = setTimeout(function() {
    if(this._logger) {
      this._logger.info('Process recovered')
    }
    this.restarts = 0
  }.bind(this), this.options.crashRecoveryPeriod)
}

module.exports = ProcessInfo
