var EventEmitter = require('wildemitter'),
  util = require('util')

var LocalProcess = function(daemon) {
  EventEmitter.call(this, {
    wildcard: true,
    delimiter: ':'
  })

  this._daemon = daemon

  // these methods are defined on the ProcessRPC class - must be kept in sync
  var methods = ['kill', 'restart', 'send', 'reportStatus', 'dumpHeap', 'forceGc', 'write', 'setClusterWorkers']
  methods.forEach(function(method) {
    this[method] = this._invoke.bind(this, method)
  }.bind(this))
}
util.inherits(LocalProcess, EventEmitter)

LocalProcess.prototype.update = function(info) {
  for(var key in info) {
    this[key] = info[key]
  }

  if(!this.cluster) {
    // this method is only present on cluster managers
    delete this.setClusterWorkers
  }
}

LocalProcess.prototype.disconnect = function(callback) {
  if(!this._remote) {
    callback()
  }

  this._remote.disconnect(callback)
}

LocalProcess.prototype._connect = function(callback) {
  this.once('_connected', callback)

  // don't try to connect more than once
  if(this._connecting) {
    return
  }

  this._connecting = true

  this._daemon.connectToProcess(this.id, function(error, remote) {
    this._connecting = false
    this._remote = remote
    this.emit('_connected', error)
  }.bind(this))
}

LocalProcess.prototype._invoke = function() {
  var method = arguments[0]
  var args = Array.prototype.slice.call(arguments)
  var callback = args[args.length - 1]

  if(typeof callback != 'function') {
    callback = function() {}
  }

  // defer execution if we're not connected yet
  if(!this._remote) {
    this._connect(function(args, callback, error) {
      if(error) {
        return callback(error)
      }

      this._invoke.apply(this, args)
    }.bind(this, args, callback))

    return
  }

  // remove the method name from the arguments array
  args = args.slice(1)

  try {
    this._remote[method].apply(this._remote, args)
  } catch(error) {
    callback(error)
  }
}

module.exports = LocalProcess
