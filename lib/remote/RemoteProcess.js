var util = require('util')
var ManagedProcess = require('../common/ManagedProcess')

var RemoteProcess = function (daemon) {
  ManagedProcess.call(this)

  Object.defineProperty(this, '_daemon', {
    value: daemon
  })
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

RemoteProcess.prototype.disconnect = function (callback) {
  if (this._rpc.disconnect) {
    this._rpc.disconnect(ManagedProcess.prototype.disconnect.bind(this, callback))
    this._connected = false
  } else {
    ManagedProcess.prototype.disconnect.call(this, callback)
  }
}

module.exports = RemoteProcess
