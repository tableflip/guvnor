var util = require('util'),
  EventEmitter = require('events').EventEmitter,
  Autowire = require('wantsit').Autowire,
  timeoutify = require('timeoutify')

var Process = function(socket) {
  EventEmitter.call(this)

  this._dnode = Autowire
  this._logger = Autowire
  this._config = Autowire
  this._socket = socket
}
util.inherits(Process, EventEmitter)

Process.prototype.connect = function(callback) {
  this._remote = this._dnode({
    // forward received events on
    sendEvent: this.emit.bind(this)
  }, {
    timeout: this._config.guvnor.rpctimeout
  })
  this._remote.on('error', function(error) {
    process.nextTick(callback.bind(callback, error))
  }.bind(this))
  this._remote.on('remote', function (remote) {
    this._logger.debug('Connected to remote')

    for(var method in remote) {
      this._logger.debug('Creating remote method', method)
      this[method] = timeoutify(remote[method].bind(remote), this._config.guvnor.timeout)
    }

    process.nextTick(callback.bind(callback, undefined, this))
  }.bind(this))
  this._remote.connect(this._socket)
}

Process.prototype.disconnect = function() {
  this._remote.end()
}

module.exports = Process
