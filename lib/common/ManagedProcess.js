var util = require('util')
var EventEmitter = require('wildemitter')
var Autowire = require('wantsit').Autowire
var timeoutify = require('timeoutify')

var ManagedProcess = function (info) {
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
    callbacks: {
      value: {},
      writable: false
    },
    _rpc: {
      value: {},
      writable: false
    },
    _connected: {
      value: false,
      writable: true
    },
    _connecting: {
      value: false,
      writable: true
    },
    _remote: {
      value: null,
      writable: true
    }
  })

  this.workers = []

  this.update(info)

  // these methods are defined on the ProcessRPC class - must be kept in sync
  var methods = [
    'kill',
    'restart',
    'send',
    'signal',
    'reportStatus',
    'dumpHeap',
    'forceGc',
    'write',
    'setClusterWorkers',
    'fetchHeapSnapshot',
    'removeHeapSnapshot'
  ]
  methods.forEach(function (method) {
    this[method] = this._invoke.bind(this, method)
  }.bind(this))
}
util.inherits(ManagedProcess, EventEmitter)

ManagedProcess.prototype.update = function (info) {
  if (!info) {
    return
  }

  for (var key in info) {
    this[key] = info[key]
  }

  if (!this.cluster) {
    // these properties are only present on cluster managers
    delete this.workers
    delete this.setClusterWorkers

    // these are declared on the prototype so can't delete them
    this.addWorker = undefined
    this.removeWorker = undefined
  }
}

ManagedProcess.prototype.disconnect = function (callback) {
  if (!this._remote) {
    if (callback) {
      callback()
    }

    return
  }

  if (callback) {
    this._remote.once('end', callback)
  }

  this._connected = false
  this._remote.end()
  this._remote = null
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
    timeout: this._config.guvnor ? this._config.guvnor.rpctimeout : this._config.rpctimeout
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

    this._bindRemoteMethods(remote)

    this.emit('_connected', undefined, this)
  }.bind(this))

  try {
    this._remote.connect(this.socket)
  } catch(e) {
    callback(e)
  }
}

ManagedProcess.prototype._bindRemoteMethods = function (remote) {
  for (var method in remote) {
    if (method === 'dumpHeap' || method === 'forceGc' || method === 'fetchHeapSnapshot') {
      // these are slow so don't timeoutify
      this._logger.debug('Exposing remote method %s without timeout', method)
      this._rpc[method] = remote[method].bind(remote)
    } else {
      this._logger.debug('Timeoutifying remote method', method)
      this._rpc[method] = timeoutify(remote[method].bind(remote), this._config.guvnor ? this._config.guvnor.timeout : this._config.timeout)
    }
  }
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

  if (typeof this._rpc[method] !== 'function') {
    return callback(new Error('No method ' + method + ' defined!'))
  }

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
