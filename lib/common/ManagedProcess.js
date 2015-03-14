var util = require('util')
var EventEmitter = require('wildemitter')
var Autowire = require('wantsit').Autowire
var timeoutify = require('timeoutify')

function noop () {
}

var ManagedProcess = function (socket) {
  EventEmitter.call(this, {
    wildcard: true,
    delimiter: ':'
  })

  this._dnode = Autowire
  this._logger = Autowire
  this._config = Autowire

  // we're going to make the callbacks object non-enumerable
  delete this.callbacks

  Object.defineProperties(this, {
    _rpc: {
      value: {},
      writable: false
    },
    callbacks: {
      value: {},
      writable: false
    }
  })

  this.workers = []

  if (socket) {
    this.socket = socket
  }

  // these methods are defined on the ProcessRPC class - must be kept in sync
  var methods = ['kill', 'restart', 'send', 'signal', 'reportStatus', 'dumpHeap', 'forceGc', 'write', 'setClusterWorkers']
  methods.forEach(function (method) {
    this[method] = this._invoke.bind(this, method)
  }.bind(this))
}
util.inherits(ManagedProcess, EventEmitter)

ManagedProcess.prototype.update = function (info) {
  for (var key in info) {
    this[key] = info[key]
  }

  if (!this.cluster) {
    // these properties are only present on cluster managers
    delete this.workers
    delete this.setClusterWorkers
    delete this.addWorker
    delete this.removeWorker
  }
}

ManagedProcess.prototype.disconnect = function (callback) {
  if (!this._remote) {
    callback()

    return
  }

  if (callback) {
    this._remote.once('end', callback)
  }

  this._connected = false
  this._remote.end()
  delete this._remote
}

ManagedProcess.prototype.connect = function (callback) {
  if (this._connected) {
    callback(undefined, this)

    return
  }

  this.once('_connected', callback)

  if (!this.socket) {
    this.emit('_connected', new Error('No socket defined'))

    return
  }

  // don't try to connect more than once
  if (this._connecting) {
    return
  }

  this._connecting = true

  this._remote = this._dnode({
    // forward received events on
    sendEvent: this.emit.bind(this)
  }, {
    timeout: this._config.guvnor.rpctimeout
  })
  this._remote.on('error', function (error) {
    if (this._connecting) {
      this._connecting = false
      this.emit('_connected', error)
    }
  }.bind(this))
  this._remote.on('remote', function (remote) {
    this._logger.debug('Connected to remote process')

    this._connecting = false
    this._connected = true

    for (var method in remote) {
      if (method === 'dumpHeap' || method === 'forceGc') {
        // these are slow so don't timeoutify
        this._logger.debug('Exposing remote method %s without timeout', method)
        this._rpc[method] = remote[method].bind(remote)
      } else {
        this._logger.debug('Timeoutifying remote method', method)
        this._rpc[method] = timeoutify(remote[method].bind(remote), this._config.guvnor.timeout)
      }
    }

    this.emit('_connected', undefined, this)
  }.bind(this))

  this._remote.connect(this.socket)
}

ManagedProcess.prototype._invoke = function (method) {
  var args = Array.prototype.slice.call(arguments)
  var callback = args[args.length - 1]

  if (typeof callback !== 'function') {
    callback = function (error) {
      if (error) {
        throw error
      }
    }
  }

  // defer execution if we're not connected yet
  if (!this._connected) {
    this.connect(function (args, callback, error) {
      if (error) {
        return callback(error)
      }

      this._invoke.apply(this, args)
    }.bind(this, args, callback))

    return
  }

  // remove the method name from the arguments array
  args = args.slice(1)

  try {
    this._rpc[method].apply(this._rpc, args)
  } catch (error) {
    callback(error)
  }
}

ManagedProcess.prototype.addWorker = function (worker) {
  if (!this.workers.some(function (existingWorker) {
      return existingWorker.id === worker.id
    })) {
    this.workers.push(worker)
  }
}

ManagedProcess.prototype.removeWorker = function (worker) {
  for (var i = 0; i < this.workers.length; i++) {
    if (this.workers[i].id === worker.id) {
      this.workers.splice(i, 1)
    }
  }
}

module.exports = ManagedProcess
