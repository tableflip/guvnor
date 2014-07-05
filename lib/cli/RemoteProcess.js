var dnode = require('dnode'),
  util = require('util'),
  EventEmitter = require('events').EventEmitter

var RemoteProcess = function(socket) {
  EventEmitter.call(this)

  this._logger = Autowire
  this._socket = socket
}
util.inherits(RemoteProcess, EventEmitter)

RemoteProcess.prototype.connect = function(callback) {
  var remote = dnode.connect(this._socket)
  remote.on('error', function(error) {
    if(error && error.code == 'EACCES') {
      error = new Error('I don\'t have permission to access ' + this._socket + ' - please run boss as a user that can.')
    }

    callback(error)
  }.bind(this))
  remote.on('remote', function (remote) {
    this._logger.debug('connected to remote')

    for(var method in remote) {
      this._logger.debug('creating remote method', method)
      this[method] = remote[method].bind(remote)
    }

    callback()
  }.bind(this))
}

module.exports = RemoteProcess
