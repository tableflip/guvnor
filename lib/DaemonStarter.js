var dnode = require('dnode'),
  fs = require('fs'),
  EventEmitter = require('events').EventEmitter,
  util = require('util'),
  child_process = require('child_process')

var DaemonStarter = function(socket, module) {
  EventEmitter.call(this)

  this._module = module
  this._socket = socket
  this._connected = false
}
util.inherits(DaemonStarter, EventEmitter)

DaemonStarter.prototype.afterPropertiesSet = function() {
  if (this._daemonIsRunning()) {
    this._connectToDaemon()
  } else {
    this.once('online', this._connectToDaemon.bind(this))
    this._startDaemon()
  }
}

DaemonStarter.prototype._startDaemon = function() {
  var daemon = child_process.fork(this._module, {
    silent: true,
    detached: true,
    cwd: process.cwd()
  })
  daemon.once('message', function(event) {
    if(event.type == 'daemon:ready') {
      this.emit('online')
    } else if(event.type == 'daemon:fatality') {
      daemon.kill()

      throw new Error(event.message)
    }
  }.bind(this))
  daemon.unref()
}

DaemonStarter.prototype._connectToDaemon = function() {
  var remote = dnode.connect(this._socket)
  remote.on('remote', function (remote) {
    remote.getApiMethods(function(methods) {
      methods.forEach(function(method) {
        this[method] = remote[method].bind(remote)
      }.bind(this))

      this._connected = true
      this.emit('ready')
    }.bind(this))
  }.bind(this))
}

DaemonStarter.prototype._daemonIsRunning = function() {
  return fs.existsSync(this._socket)
}

DaemonStarter.prototype.invoke = function(func) {
  if(this._connected) {
    func()
  } else {
    this.once('ready', func)
  }
}

module.exports = DaemonStarter
