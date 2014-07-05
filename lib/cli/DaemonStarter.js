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
      this._startDaemon()
    }
  }.bind(this))
}

DaemonStarter.prototype._startDaemon = function() {
  this._logger.debug('Starting daemon')
  var daemon = child_process.fork(this._module, {
    silent: false,
    //detached: true,
    cwd: process.cwd()
  })
  daemon.once('message', function(event) {
    if(event.type == 'daemon:ready') {
      this._logger.debug('Daemon online')
      this._connectToDaemon()
    }

    if(event.type == 'daemon:fatality') {
      this._logger.debug('Daemon encountered exception')
      daemon.kill()

      throw new Error(event.message)
    }
  }.bind(this))
  daemon.unref()
}

DaemonStarter.prototype._connectToDaemon = function() {
  this._logger.debug('Connecting to daemon')
  var remote = dnode.connect(this._socket)
  remote.on('error', function(error) {
    if(error) {
      if (error.code == 'EACCES') {
        throw new Error('I don\'t have permission to access ' + this._socket + ' - please run boss as a user that can.')
      } else if (error.code == 'ECONNREFUSED') {
        this._logger.debug('Connection refused - the socket may be stale')

        fs.unlink(this._socket, function(error) {
          if(error) throw new Error('Could not remove stale socket file ' + error)

          this._logger.debug('Removed stale socket file')

          this._startDaemon()

        }.bind(this))
      }
    } else {
      throw error
    }
  }.bind(this))
  remote.once('remote', function (remote) {
    this._logger.debug('Connected to daemon')

    remote.getApiMethods(function(methods) {
      methods.forEach(function(method) {
        this[method] = remote[method].bind(remote)
      }.bind(this))

      this._connected = true

      this._logger.debug('Created api methods')

      this.emit('ready')
    }.bind(this))
  }.bind(this))
}

DaemonStarter.prototype._daemonIsRunning = function() {
  this._logger.debug('Looking for socket at', this._socket)
  var result = fs.existsSync(this._socket)
  this._logger.debug('Found socket', result)

  return result
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
