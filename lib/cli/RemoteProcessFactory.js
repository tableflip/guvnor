var RemoteProcess = require('./RemoteProcess')
  Autowire = require('wantsit').Autowire

var RemoteProcessFactory = function() {
  this._logger = Autowire
}

RemoteProcessFactory.prototype.containerAware = function(container) {
  this._container = container
}

RemoteProcessFactory.prototype.create = function(socket) {
  this._logger.debug('creating remote process to connect to', socket)

  var remoteProcess = new RemoteProcess(socket)

  this._container.autowire(remoteProcess)

  return remoteProcess
}

module.exports = RemoteProcessFactory
