var EventEmitter = require('wildemitter')
var util = require('util')
var Autowire = require('wantsit').Autowire
var timeoutify = require('timeoutify')

var LocalDaemonConnection = function (socketName) {
  EventEmitter.call(this, {
    wildcard: true,
    delimiter: ':'
  })

  this._connected = false

  Object.defineProperty(this, 'connected', {
    enumerable: true,
    get: function () {
      return this._connected
    }.bind(this)
  })

  this._socketName = socketName
  this._client = null
  this._logger = Autowire
  this._fs = Autowire
  this._dnode = Autowire
  this._config = Autowire
}
util.inherits(LocalDaemonConnection, EventEmitter)

LocalDaemonConnection.prototype.disconnect = function (callback) {
  if (!this._client || !this.connected) {
    this._logger.debug('Not connected to the daemon')

    if (callback) {
      callback()
    }

    return
  }

  this._connected = false
  this._logger.debug('Disconnecting from daemon socket', this._socketName)
  this._client.once('end', function () {
    this._logger.debug('Disconnected from daemon socket', this._socketName)

    delete this._client

    if (callback) {
      callback()
    }
  }.bind(this))

  this._client.stream.end()
  this._client.stream.destroy()
  this._client.destroy()
}

LocalDaemonConnection.prototype.connect = function (api, callback) {
  return this._connect(this._config.guvnor.rundir + '/' + this._socketName, api, callback)
}

LocalDaemonConnection.prototype._connect = function (socket, api, callback) {
  this._logger.debug('Connecting to daemon on', socket)

  var serverApi = {}

  this._client = this._dnode(api, {
    timeout: this._config.guvnor.rpctimeout
  })
  this._client.connect(socket, function (remote) {
    this._logger.debug('Connected to daemon on', socket)

    for (var method in remote) {
      if (typeof (remote[method]) !== 'function') {
        continue
      }

      var func

      if (method === 'deployApplication' ||
        method === 'removeApplication' ||
        method === 'runApplication' ||
        method === 'switchApplicationRef'
      ) {
        this._logger.debug('Exposing remote method without timeout', method)
        func = remote[method].bind(remote)
      } else {
        this._logger.debug('Timeoutifying remote method', method)
        func = timeoutify(remote[method].bind(remote), this._config.guvnor.timeout)
      }

      func = function (func, method) {
        var args = Array.prototype.slice.call(arguments, 2)
        var callback = args[args.length - 1]

        if (typeof callback !== 'function') {
          callback = function () {}
        }

        if (this._connected) {
          // we are connected, invoke remote argument
          func.apply(func, args)
        } else if (method === 'kill') {
          // trying to kill a dead daemon, just invoke the callback
          callback()
        } else {
          // not connected
          var error = new Error('Daemon was not running')
          error.code = 'DAEMON_NOT_RUNNING'

          callback(error)
        }
      }.bind(this, func, method)

      // prepend user information to the remote method invocation
      // it's probably dangerous to rely on this because it's easily faked
      serverApi[method] = function (func) {
        var args = Array.prototype.slice.call(arguments, 1)
        args.unshift(process.getuid())
        func.apply(func, args)
      }.bind(this, func)
    }

    this._connected = true

    callback(undefined, serverApi)
  }.bind(this))
  this._client.on('error', function (error) {
    if (error.code === 'EACCES') {
      error.message = "I don't have permission to access " + socket + ' - please run guvnor as a user that can.'

      return callback(error)
    } else if (error.code === 'ECONNREFUSED') {
      this._logger.debug('Connection refused - the socket may be stale')

      this._fs.unlink(socket, function (error) {
        if (!error) {
          this._logger.debug('Removed stale socket file')
          error = new Error('Daemon was not running')
          error.code = 'DAEMON_NOT_RUNNING'
        }

        callback(error)
      }.bind(this))

      return
    } else if (error.code === 'ENOENT') {
      this._logger.debug('Socket file did not exist - the daemon is probably not running')

      error = new Error('Daemon was not running')
      error.code = 'DAEMON_NOT_RUNNING'

      return callback(error)
    } else if (error.code === 'ENOTSOCK') {
      return callback(new Error(socket + ' is not a socket - please check the guvnor.rundir property in your config file'))
    }

    if (this.connected) {
      throw error
    }

    return callback(error)
  }.bind(this))
  this._client.on('end', function () {
    this._connected = false
  }.bind(this))
}

module.exports = LocalDaemonConnection
