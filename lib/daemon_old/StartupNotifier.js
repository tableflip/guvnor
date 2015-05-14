var Autowire = require('wantsit').Autowire

var StartupNotifier = function () {
  this._userRpc = Autowire
  this._adminRpc = Autowire
  this._remoteRpc = Autowire
  this._nodeInspectorWrapper = Autowire
  this._parentProcess = Autowire
  this._commandLine = Autowire
  this._fileSystem = Autowire
}

StartupNotifier.prototype.afterPropertiesSet = function () {
  // change directory to the rundir
  process.chdir(this._fileSystem.getRunDir())

  // all done, send our parent process a message
  this._parentProcess.send('daemon:ready', {
    user: this._userRpc.socket,
    admin: this._adminRpc.socket,
    remote: this._remoteRpc.port,
    debug: this._nodeInspectorWrapper.debuggerPort
  })
}

module.exports = StartupNotifier
