var util = require('util')
var ManagedProcess = require('../common/ManagedProcess')

var RemoteProcess = function (daemon) {
  ManagedProcess.call(this)

  this._daemon = daemon
}
util.inherits(RemoteProcess, ManagedProcess)

RemoteProcess.prototype.connect = function (callback) {
  this.once('_connected', callback)

  this._daemon._connectToProcess(this.id, function (error, remote) {
    if (!error) {
      this._bindRemoteMethods(remote)
    }

    this._connected = true

    this.emit('_connected', undefined, this)
  }.bind(this))
}

module.exports = RemoteProcess
