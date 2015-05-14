var Autowire = require('wantsit').Autowire
var EventEmitter = require('events').EventEmitter
var util = require('util')

var RpcEndpoint = function () {
  EventEmitter.call(this)

  this._logger = Autowire
  this._guvnor = Autowire
  this._config = Autowire
  this._posix = Autowire
  this._fs = Autowire
  this._dnode = Autowire
  this._fileSystem = Autowire
  this._userDetailsStore = Autowire

  this._connections = {}
}
util.inherits(RpcEndpoint, EventEmitter)

RpcEndpoint.prototype.afterPropertiesSet = function (done) {
  // create pass-through methods for guvnor
  this._getApi().forEach(function (method) {
    if (!this._guvnor[method]) {
      this._logger.error('Tried to expose', method, 'as an RPC method but it did not exist!')
    }

    this[method] = this._guvnor[method].bind(this._guvnor)
  }.bind(this))

  // find a socket to listen on
  this.socket = this._fileSystem.getRunDir() + '/' + this._getSocketName()

  // make sure we clean up the socket file if we can
  process.on('exit', this._removeSocketFile.bind(this))
  process.on('SIGINT', this._removeSocketFile.bind(this))

  this._createDnodeServer(done)
}

RpcEndpoint.prototype._getSocketName = function () {
  return 'socket'
}

RpcEndpoint.prototype._createDnodeServer = function (done) {
  var oldmask = process.umask(this._getUmask())
  var self = this

  // publish RPC methods
  var server = this._dnode(function (client, connection) {
    self._logger.debug('incoming connection - client:', client, 'id: ', connection.id)

    // store connection
    self._connections[connection.id] = client

    // make sure we get rid of the connection when the client goes away
    connection.on('end', function (id) {
      delete this._connections[id]
      this._logger.debug('client connection', id, 'ended')
    }.bind(self, connection.id))
    connection.on('error', function (id, error) {
      delete this._connections[id]
      this._logger.debug('client connection', id, 'erred', error)
    }.bind(self, connection.id))

    connection.stream.on('error', function (id, error) {
      delete this._connections[id]
      this._logger.debug('client connection socket', id, 'erred', error)
    }.bind(self, connection.id))

    var api = self._generateApi()

    for (var key in api) {
      this[key] = api[key].bind(self)
    }
  }, {
    timeout: this._config.guvnor.rpctimeout
  })
  var socket = server.listen({
    path: this.socket
  }, function () {
    process.umask(oldmask)

    var gid = this._posix.getgrnam(this._config.guvnor.group).gid

    this._fs.chown(this.socket, process.getuid(), gid, function (error) {
      // make sure the socket still exists
      var checkSocketPresent = function () {
        this._fs.exists(this.socket, function (exists) {
          if (!exists) {
            this._logger.warn('Socket file has disappeared, will restart dnode')

            try {
              socket.close()
              server.destroy()
            } catch (e) {
              this._logger.warn('Failed to stop dnode after socket file was deleted')
              this._logger.warn(error)
            }

            this._createDnodeServer()
          } else {
            setTimeout(checkSocketPresent.bind(this), 10000).unref()
          }
        }.bind(this))
      }.bind(this)
      setTimeout(checkSocketPresent.bind(this), 10000).unref()

      if (done) {
        done(error)
      }
    }.bind(this))
  }.bind(this))
  socket.on('error', function (error) {
    this._logger.warn('Socket error', error)
  }.bind(this))
  server.on('error', function (error) {
    this._logger.warn('Server error', error)
  }.bind(this))
  socket.on('end', function (error) {
    this._logger.warn('Socket end', error)
  }.bind(this))
  server.on('end', function (error) {
    this._logger.warn('Server end', error)
  }.bind(this))
}

RpcEndpoint.prototype._getApi = function () {
  return []
}

RpcEndpoint.prototype._getUmask = function () {}

RpcEndpoint.prototype._generateApi = function () {
  var api = {}

  this._getApi().forEach(function (method) {
    api[method] = function (method) {
      try {
        var args = Array.prototype.slice.call(arguments, 1)

        this._userDetailsStore.findOrCreate('uid', args[0], [args[0]], function (method, args, error, userDetails) {
          if (error) return args[args.length - 1](error)

          args[0] = userDetails

          try {
            this[method].apply(this, args)
          } catch (error) {
            args[args.length - 1](error)
          }
        }.bind(this, method, args))
      } catch (error) {
        this._logger.error('Exception thrown while invoking API method')

        if (error) {
          this._logger.error(error)

          if (error.stack) {
            this._logger.error(error.stack)
          }
        } else {
          console.trace()
        }
      }
    }.bind(this, method)
  }.bind(this))

  return api
}

RpcEndpoint.prototype._removeSocketFile = function () {
  if (this._fs.existsSync(this.socket)) {
    this._logger.debug('Removing socket from', this.socket)
    this._fs.unlinkSync(this.socket)
  } else {
    this._logger.debug('Socket already gone?')
  }
}

RpcEndpoint.prototype.broadcast = function () {
  var args = Array.prototype.slice.call(arguments)

  Object.keys(this._connections).forEach(function (id) {
    var client = this._connections[id]

    if (!client || !client.sendEvent) {
      return
    }

    client.sendEvent.apply(client, args)
  }.bind(this))
}

module.exports = RpcEndpoint
