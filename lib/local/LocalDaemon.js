var EventEmitter = require('wildemitter'),
  util = require('util'),
  Autowire = require('wantsit').Autowire,
  async = require('async'),
  DaemonConnection = require('../common/DaemonConnection')

var LocalDaemon = function() {
  DaemonConnection.call(this)

  this._localDaemonStarter = Autowire
  this._localDaemonAdminConnection = Autowire
  this._localDaemonUserConnection = Autowire
}
util.inherits(LocalDaemon, DaemonConnection)

LocalDaemon.prototype._connect = function(callback) {
  if(this._localDaemonUserConnection.connected) {
    this._logger.debug('Already connected to daemon, executing callback')
    process.nextTick(callback.bind(callback, undefined, this))

    return
  }

  // try to connect to daemon
  this._localDaemonUserConnection.connect(this._api, function(error, serverApi) {
    if(error) return callback(error)

    // expose server user methods
    for(var key in serverApi) {
      this[key] = serverApi[key]
    }

    // reset process list
    this._processes = {}

    this._overrideProcessInfoMethods()

    this._localDaemonAdminConnection.connect(this._api, function(error, serverApi) {
      if(error) {
        if(error.code == 'EACCES') {
          // this user cannot connect to the admin socket
          this._logger.debug('Access to admin socket denied')
          return callback(undefined, this)
        } else {
          return callback(error)
        }
      }

      // expose server admin methods
      for(var key in serverApi) {
        this[key] = serverApi[key]
      }

      return callback(undefined, this)
    }.bind(this))
  }.bind(this))
}

LocalDaemon.prototype.connectOrStart = function(callback) {
  this.connect(function(error, daemon) {
    if(error && error.code == 'DAEMON_NOT_RUNNING') {
      this._logger.debug('Daemon was not running so will start it')

      this._localDaemonStarter.start(function(error) {
        if(error) {
          return callback(error)
        }

        this._logger.debug('Daemon started')

        this.connect(callback)
      }.bind(this))

      return
    }

    return callback(error, daemon)
  }.bind(this))
}

LocalDaemon.prototype.disconnect = function(callback) {
  async.parallel([
    this._localDaemonStarter.disconnect.bind(this._localDaemonStarter),
    this._localDaemonUserConnection.disconnect.bind(this._localDaemonUserConnection),
    this._localDaemonAdminConnection.disconnect.bind(this._localDaemonAdminConnection)
  ], function(error) {
    if(callback) {
      callback(error)
    }
  })
}

LocalDaemon.prototype._connectToProcess = function(id, callback) {
  if(!this._localDaemonUserConnection.connected) {
    return callback(new Error('Not connected to remote daemon'))
  }

  this.findProcessInfoById(id, function(error, processInfo) {
    if(error) return callback(error)
    if(!processInfo) return callback()

    if(!processInfo.socket) {
      return callback(new Error('Process ' + processInfo.name + ' is not ready yet'))
    }

    processInfo.connect(callback)
  }.bind(this))
}

module.exports = LocalDaemon
