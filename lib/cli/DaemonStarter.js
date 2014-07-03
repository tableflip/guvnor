var dnode = require('dnode'),
  fs = require('fs'),
  EventEmitter = require('events').EventEmitter,
  util = require('util'),
  child_process = require('child_process'),
  Autowire = require('wantsit').Autowire

var DaemonStarter = function() {
  EventEmitter.call(this)

  this._connected = false
  this._logger = Autowire
}
util.inherits(DaemonStarter, EventEmitter)

DaemonStarter.prototype.afterPropertiesSet = function() {
  this._module = this.getModule()
  this._socket = this.getSocket(function(error, socket) {
    if(error) throw error

    this._socket = socket

    if (this._daemonIsRunning()) {
      this._connectToDaemon()
    } else {
      this.once('online', this._connectToDaemon.bind(this))
      this._startDaemon()
    }
  }.bind(this))
}

DaemonStarter.prototype._startDaemon = function() {
  var daemon = child_process.fork(this._module, {
    silent: false,
    //detached: true,
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

DaemonStarter.prototype.connect = function() {
  return {
    then: function(func) {
      if(this._connected) {
        func()
      } else {
        this.once('ready', func)
      }
    }.bind(this)
  }
}

module.exports = DaemonStarter
