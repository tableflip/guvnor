var EventEmitter = require('wildemitter'),
  util = require('util'),
  Autowire = require('wantsit').Autowire,
  async = require('async')

var LocalDaemon = function() {
  EventEmitter.call(this, {
    wildcard: true,
    delimiter: ':'
  })

  this._semver = Autowire
  this._logger = Autowire
  this._processFactory = Autowire
  this._localDaemonStarter = Autowire
  this._localDaemonAdminConnection = Autowire
  this._localDaemonUserConnection = Autowire

  this._api = {
    sendEvent: function() {
      this.emit.apply(this, arguments)
    }.bind(this)
  }
}
util.inherits(LocalDaemon, EventEmitter)

LocalDaemon.prototype.connectOrStart = function(callback) {
  if(!this._semver.satisfies(process.versions.node, '>=0.10.29')) {
    return callback(new Error('Please use node 0.10.29 or later'))
  }

  if(this._localDaemonUserConnection.connected) {
    this._logger.debug('Already connected to daemon, executing callback')
    process.nextTick(callback.bind(callback, undefined, this))
  } else {
    this._logger.debug('Will attempt to connect or start daemon')

    this.once('_connected', function(error, serverApi) {
      if(error) {
        this._logger.debug('Encountered error connecting to daemon', error)
        return callback(error)
      }

      this._logger.debug('Exposing server user methods')

      // expose server methods
      for(var key in serverApi) {
        this[key] = serverApi[key]
      }

      this._localDaemonAdminConnection.connect(this._api, function(error, serverApi) {
        if(!error) {
          this._logger.debug('Exposing server admin methods')

          // expose server methods
          for(var key in serverApi) {
            this[key] = serverApi[key]
          }
        } else {
          this._logger.debug('Encountered error with admin socket', error)
        }

        // all systems go
        return callback(undefined, this)
      }.bind(this))
    }.bind(this))

    this._connectOrStartDaemon()
  }
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

LocalDaemon.prototype._connectOrStartDaemon = function() {
  // try to connect to daemon
  this._localDaemonUserConnection.connect(this._api, function(error, serverApi) {
    if(!error) {
      return this.emit('_connected', error, serverApi)
    }

    if(error.code == 'DAEMON_NOT_RUNNING') {
      this._logger.debug('Daemon was not running so will start it')

      this._localDaemonStarter.start(function(error) {
        if(error) return this.emit('_connected', error)

        this._logger.debug('Daemon started')
        this._localDaemonUserConnection.connect(this._api, function(error, serverApi) {
          this.emit('_connected', error, serverApi)
        }.bind(this))
      }.bind(this))
    } else {
      this._logger.debug('Error encountered while starting daemon', error)
      return this.emit('_connected', error, serverApi)
    }
  }.bind(this))
}

LocalDaemon.prototype.connectToProcess = function(id, callback) {
  if(!this._localDaemonUserConnection.connected) {
    return callback(new Error('Not connected to remote daemon'))
  }

  this.findProcessInfoById(id, function(error, processInfo) {
    if(error) return callback(error)
    if(!processInfo) return callback()

    if(!processInfo.socket) {
      return callback(new Error('Process ' + processInfo.name + ' is not ready yet'), processInfo)
    }

    this._processFactory.create([processInfo.socket], function(error, proc) {
      if(error) return callback(error)

      proc.connect(callback)
    })
  }.bind(this))
}

module.exports = LocalDaemon
