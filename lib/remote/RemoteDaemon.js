var util = require('util')
var Autowire = require('wantsit').Autowire
var timeoutify = require('timeoutify')
var DaemonConnection = require('../common/DaemonConnection')

var RemoteDaemon = function (host, port, principal, secret, timeout, rpcTimeout) {
  DaemonConnection.call(this)

  this._host = host
  this._port = port
  this._principal = principal
  this._secret = secret
  this._timeout = timeout
  this._rpcTimeout = rpcTimeout
  this._disconnecting = false

  this._dnode = Autowire
  this._crypto = Autowire
  this._tls = Autowire
}
util.inherits(RemoteDaemon, DaemonConnection)

RemoteDaemon.prototype._connect = function (callback) {
  if (this._connected) {
    this._logger.debug('Already connected to daemon, executing callback')
    process.nextTick(callback.bind(callback, undefined, this))
  } else {
    this._logger.debug('Will attempt to connect to daemon')
    this._connectToDaemon(callback)
  }
}

RemoteDaemon.prototype.disconnect = function (callback) {
  if (!this._client) {
    if (callback) {
      process.nextTick(callback)
    }

    return
  }

  if (callback) {
    this._client.once('end', callback)
  }

  if (this._disconnecting) {
    return
  }

  this._disconnecting = true
  this._client.once('end', function () {
    delete this._client
  }.bind(this))
  this._client.end()
}

RemoteDaemon.prototype._signAndInvoke = function () {
  var args = Array.prototype.slice.call(arguments)
  var callback = args.shift()

  this._crypto.sign(this._principal, this._secret, function (error, signature) {
    if (error) {
      return callback(error)
    }

    args.unshift(signature)

    callback.apply(callback, args)
  })
}

RemoteDaemon.prototype._connectToDaemon = function (callback) {
  var api = {
    sendEvent: function () {
      this.emit.apply(this, arguments)
    }.bind(this)
  }

  this._client = this._tls.connect(this._port, {
    host: this._host,
    rejectUnauthorized: false
  }, function () {
    var d = this._dnode(api, {
      timeout: this._rpcTimeout
    })
    d.on('remote', function (remote) {
      this._logger.info('Connected to Guvnor on %s:%d', this._host, this._port)
      this._logger.debug('Exposing server methods')

      for (var method in remote) {
        if (typeof (remote[method]) !== 'function') {
          continue
        }

        var func

        if (method === 'deployApplication' ||
          method === 'removeApplication' ||
          method === 'runApplication' ||
          method === 'switchApplicationRef' ||
          method === 'updateApplicationRefs'
        ) {
          this._logger.debug('Exposing remote method without timeout', method)
          func = remote[method].bind(remote)
        } else {
          this._logger.debug('Timeoutifying remote method', method)
          func = timeoutify(remote[method].bind(remote), this._timeout)
        }

        this[method] = this._signAndInvoke.bind(this, func)
      }

      this._connected = true

      // reset process and app lists
      this._processStore.removeAll()
      this._appStore.removeAll()

      this._overrideProcessInfoMethods()
      this._overrideAppMethods()

      process.nextTick(callback.bind(callback, undefined, this))
    }.bind(this))

    this._client.pipe(d).pipe(this._client)
  }.bind(this))

  this._client.on('error', function (error) {
    var clientError = new Error('Could not connect')

    if (error.code === 'ECONNREFUSED') {
      clientError.code = 'CONNECTIONREFUSED'

      this._logger.info('Connection to %s:%d refused, will try again in a little while', this._host, this._port)
      this._reconnect(callback)
    } else if (error.code === 'ECONNRESET') {
      clientError.code = 'CONNECTIONRESET'

      this._logger.info('Connection to %s:%d reset, will try again in a little while', this._host, this._port)
      this._reconnect(callback)
    } else if (error.code === 'ENOTFOUND') {
      clientError.code = 'HOSTNOTFOUND'

      this._logger.info('Could not resolve IP address for %s, will try again in a little while', this._host)
      this._reconnect(callback)
    } else if (error.code === 'ETIMEDOUT') {
      clientError.code = 'TIMEDOUT'

      this._logger.info('Connection to %s timed out, will try again in a little while', this._host)
      this._reconnect(callback)
    } else if (error.code === 'ENETDOWN') {
      clientError.code = 'NETWORKDOWN'

      this._logger.info('Your network connection went down, will try to connect to %s again in a little while', this._host)
      this._reconnect(callback)
    } else {
      this._logger.error(error.stack ? error.stack : error)
    }

    process.nextTick(callback.bind(callback, clientError))
  }.bind(this))
  this._client.on('end', function () {
    if (!this._disconnecting) {
      this._logger.info('Guvnor %s:%d unexpectedly disconnected, will reconnect in a little while', this._host, this._port)
      this._reconnect(callback)
    }

    this.emit('disconnected')
  }.bind(this))
  this._client.on('fail', function () {
    this._logger.info('Connection failed')
  }.bind(this))
}

RemoteDaemon.prototype._reconnect = function (callback) {
  if (this._reconnectTimeout) {
    return
  }

  this._reconnectTimeout = setTimeout(function () {
    delete this._reconnectTimeout
    this._connectToDaemon(callback)
  }.bind(this), 5000)
}

RemoteDaemon.prototype.connectToProcess = function (processId, callback) {
  this._logger.warn('Deprecation warning: connectToProcess will be removed in a future release, please use methods on process objects instead')

  this._connectToProcess(processId, function (error, remoteProcess) {
    var remote

    if (!error) {
      remote = {}

      for (var key in remoteProcess) {
        // don't timeoutify slow methods
        if (key === 'dumpHeap' || key === 'deployApplication' || key === 'removeApplication' || key === 'switchApplicationRef' || key === 'updateApplicationRefs' || key === 'fetchHeapSnapshot') {
          remote[key] = remoteProcess[key]
        } else {
          remote[key] = timeoutify(remoteProcess[key].bind(remoteProcess), this._timeout)
        }
      }
    }

    process.nextTick(callback.bind(callback, error, remote))
  }.bind(this))
}

module.exports = RemoteDaemon
