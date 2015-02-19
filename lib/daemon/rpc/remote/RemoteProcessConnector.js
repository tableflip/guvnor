var Autowire = require('wantsit').Autowire,
  util = require('util'),
  UserProcess = require('../../action/UserProcess')

var RemoteProcessConnector = function() {
  UserProcess.call(this)

  this._processFactory = Autowire
}
util.inherits(RemoteProcessConnector, UserProcess)

RemoteProcessConnector.prototype._run = function(ready, callback) {
  this._processFactory.create([process.env.GUVNOR_SOCKET], function(error, proc) {
    if(error) return this._sendError(error)

    proc.connect(function(error, remoteProcess) {
      if(error) return this._sendError(error)

      process.on('message', function(event) {
        if(!event) {
          return
        }

        if(!Array.isArray(event.args)) {
          return
        }

        event.args.push(function() {
          var args = Array.prototype.slice.call(arguments)
          args.unshift(undefined)

          callback.apply(callback, args)

          remoteProcess.disconnect()
        })

        if(typeof remoteProcess[event.method] != 'function') {
          return callback(new Error('Invalid method name', event.method))
        }

        remoteProcess[event.method].apply(remoteProcess, event.args)
      }.bind(this))

      ready()
    }.bind(this))
  }.bind(this))
}

module.exports = RemoteProcessConnector
