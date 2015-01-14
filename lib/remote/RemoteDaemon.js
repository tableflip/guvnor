var EventEmitter = require('wildemitter'),
  util = require('util'),
  Autowire = require('wantsit').Autowire,
  timeoutify = require('timeoutify')

var RemoteDaemon = function(host, port, principal, secret, timeout) {
  EventEmitter.call(this, {
    wildcard: true,
    delimiter: ':'
  })

  this._host = host
  this._port = port
  this._principal = principal
  this._secret = secret
  this._timeout = timeout
  this._disconnecting = false

  this._logger = Autowire
  this._dnode = Autowire
  this._crypto = Autowire
  this._tls = Autowire
}
util.inherits(RemoteDaemon, EventEmitter)

RemoteDaemon.prototype.connect = function(callback) {
  if(this._connected) {
    this._logger.debug('Already connected to daemon, executing callback')
    process.nextTick(callback.bind(callback, undefined, this))
  } else {
    this._logger.debug('Will attempt to connect to daemon')
    this._connectToDaemon(callback)
  }
}

RemotesiDaemon.prototype.disconnect = function(callback) {
  if(!this._client) {
    if(callback) {
      process.nextTick(callback)
    }

    return
  }

  if(callback) {
    this._client.once('end', callback)
  }

  if(this._disconnecting) {
    return
  }

  this._disconnecting = true
  this._client.once('end', function() {
    delete this._client
  }.bind(this))
  this._client.end()
}

RemoteDaemon.prototype._signAndInvoke = function() {
  var args = Array.prototype.slice.call(arguments)
  var callback = args.shift()

  this._crypto.sign(this._principal, this._secret, function(error, signature) {
    args.unshift(signature)

    process.nextTick(function() {
      callback.apply(callback, args)
    })
  })
}

RemoteDaemon.prototype._connectToDaemon = function(callback) {
  var api = {
    sendEvent: function() {
      this.emit.apply(this, arguments)
    }.bind(this)
  }

  this._client = this._tls.connect(this._port, {
    host: this._host,
    rejectUnauthorized: false
  }, function() {
    var d = this._dnode(api)
    d.on('remote', function(remote) {
      this._logger.info('Connected to Boss on %s:%d', this._host, this._port)
      this._logger.debug('Exposing server methods')

      for(var method in remote) {
        if(typeof(remote[method]) !== 'function') {
          continue
        }

        this._logger.debug('Exposing server method', method)
        this[method] = this._signAndInvoke.bind(this, timeoutify(remote[method].bind(remote), this._timeout))
      }

      this._connected = true

      process.nextTick(callback.bind(callback, undefined, this))
    }.bind(this))

    this._client.pipe(d).pipe(this._client)
  }.bind(this))

  this._client.on('error', function(error) {
    var clientError = new Error('Could not connect')

    if(error.code == 'ECONNREFUSED') {
      clientError.code = 'CONNECTIONREFUSED'

      this._logger.info('Connection to %s:%d refused, will try again in a little while', this._host, this._port)
      setTimeout(this._connectToDaemon.bind(this, callback), 5000)
    } else if(error.code == 'ECONNRESET') {
      clientError.code = 'CONNECTIONRESET'

      this._logger.info('Connection to %s:%d reset, will try again in a little while', this._host, this._port)
      setTimeout(this._connectToDaemon.bind(this, callback), 5000)
    } else if(error.code == 'ENOTFOUND') {
      clientError.code = 'HOSTNOTFOUND'

      this._logger.info('Could not resolve IP address for %s, will try again in a little while', this._host)
      setTimeout(this._connectToDaemon.bind(this, callback), 5000)
    } else if(error.code == 'ETIMEDOUT') {
      clientError.code = 'TIMEDOUT'

      this._logger.info('Connection to %s timed out, will try again in a little while', this._host)
      setTimeout(this._connectToDaemon.bind(this, callback), 5000)
    } else if(error.code == 'ENETDOWN') {
      clientError.code = 'NETWORKDOWN'

      this._logger.info('Your network connection went down, will try to connect to %s again in a little while', this._host)
      setTimeout(this._connectToDaemon.bind(this, callback), 5000)
    } else {
      this._logger.error(error.stack ? error.stack : error)
    }

    process.nextTick(callback.bind(callback, clientError))
  }.bind(this))
  this._client.on('end', function() {
    if(!this._disconnecting) {
      this._logger.info('Boss %s:%d unexpectedly disconnected, will reconnect in a little while', this._host, this._port)
      setTimeout(this._connectToDaemon.bind(this, callback), 5000)
    }

    this.emit('disconnected')
  }.bind(this))
  this._client.on('fail', function() {
    this._logger.info('Connection failed')
  }.bind(this))
}

RemoteDaemon.prototype.connectToProcess = function(processId, callback) {
  this._connectToProcess(processId, function(error, remoteProcess) {
    var remote

    if(!error) {
      remote = {}

      for(var key in remoteProcess) {
        if(key == 'dumpHeap' || key == 'deployApplication') {
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
