var EventEmitter = require('wildemitter'),
  util = require('util')

var LocalProcess = function(daemon) {
  EventEmitter.call(this, {
    wildcard: true,
    delimiter: ':'
  })

  this._daemon = daemon

  // these methods are defined on the ProcessRPC class - must be kept in sync
  var methods = ['kill', 'restart', 'send', 'reportStatus', 'dumpHeap', 'forceGc', 'write']
  methods.forEach(function(method) {
    this[method] = function() {
      var args = Array.prototype.slice.call(arguments)

      this._daemon.connectToProcess(this.id, function(args, error, remote) {
        var callback = args[args.length - 1]

        if(typeof callback != 'function') {
          callback = function() {}
        }

        if(error) {
          return callback(error)
        }

        try {
          remote[method].apply(remote, args)
        } catch(error) {
          callback(error)
        } finally {
          try {
            remote.disconnect()
          } catch(e) {

          }
        }
      }.bind(this, args))
    }.bind(this)
  }.bind(this))
}
util.inherits(LocalProcess, EventEmitter)

LocalProcess.prototype.update = function(info) {
  for(var key in info) {
    this[key] = info[key]
  }
}

module.exports = LocalProcess