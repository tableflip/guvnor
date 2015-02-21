var EventEmitter = require('events').EventEmitter,
  util = require('util'),
  cluster = require('cluster')

var ParentProcess = function() {
  EventEmitter.call(this)

  if(process.send) {
    process.on('message', function(message) {
      this.emit.apply(this, [message.event].concat(message.args ? message.args : []))
    }.bind(this))
  }
}
util.inherits(ParentProcess, EventEmitter)

ParentProcess.prototype.send = function(event) {
  if(!process.send) {
    return
  }

  // if we are a worker, swap out process:foo for worker:foo
  if(event.substring(0, 'process:'.length) == 'process:') {
    if(cluster.isWorker) {
      event = 'worker:' + event.substring('process:'.length)
    } else if(process.env.GUVNOR_IS_CLUSTER) {
      // cannot use cluster.isMaster here because every process is a cluster master unless
      // it was forked by a cluster master, capisce?
      event = 'cluster:' + event.substring('process:'.length)
    }
  }

  var message = {
    event: event,
    args: Array.prototype.slice.call(arguments, 1).map(function(arg) {
      return this._remotePrivateFieldsFromObject(arg)
    }.bind(this))
  }

  try {
    // this will get picked up by the wrapping ProcessInfo object and turned back into an event
    process.send(message)
  } catch(error) {
    console.error(error)
  }
}

ParentProcess.prototype._remotePrivateFieldsFromObject = function(object) {
  if(!object) {
    return object
  }

  if(Array.isArray(object)) {
    return object.map(function(entry) {
      return this._remotePrivateFieldsFromObject(entry)
    }.bind(this))
  }

  if(typeof object != 'object') {
    return object
  }

  if(typeof object == 'string' || object instanceof String) {
    return object
  }

  var output = {}

  Object.keys(object).forEach(function(key) {
    if(key.substring(0, 1) == '_') {
      return
    }

    output[key] = this._remotePrivateFieldsFromObject(object[key])
  }.bind(this))

  return output
}

module.exports = ParentProcess
