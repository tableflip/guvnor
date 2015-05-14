var Autowire = require('wantsit').Autowire
var startDaemon = require('./start-daemon')

var LocalDaemonStarter = function () {
  this._client = false
  this._logger = Autowire
  this._config = Autowire
  this._child_process = Autowire
}

LocalDaemonStarter.prototype.start = function (callback) {
  this._logger.debug('Starting daemon')

  startDaemon(this._config, callback)
}

LocalDaemonStarter.prototype._tearDownDaemon = function () {
  if (this._daemon) {
    this._daemon.removeAllListeners('error')
    this._daemon.removeAllListeners('exit')
    this._daemon.removeAllListeners('close')
    this._daemon.removeAllListeners('disconnect')
    this._daemon.removeAllListeners('message')

    if (this._config.daemonise && this._config.daemonize) {
      if (this._daemon.connected) {
        this._daemon.disconnect()
      }

      this._daemon = null
    }
  }
}

LocalDaemonStarter.prototype.disconnect = function (callback) {
  this._tearDownDaemon()

  callback()
}

module.exports = LocalDaemonStarter
