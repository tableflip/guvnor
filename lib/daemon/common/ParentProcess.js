var EventEmitter = require('events').EventEmitter,
  util = require('util'),
  cluster = require('cluster')

var ParentProcess = function() {
  EventEmitter.call(this)

  if(process.send) {
    process.on('message', function(event) {
      this.emit.apply(this, [event.type].concat(event.args))
    }.bind(this))
  }
}
util.inherits(ParentProcess, EventEmitter)

ParentProcess.prototype.send = function(type, data) {
  if(!process.send) {
    return
  }

  // if we are a worker, swap out process:foo for worker:foo
  if(cluster.isWorker && type.substring(0, 'process:'.length) == 'process:') {
    type = 'worker:' + type.substring('process:'.length)
  }

  var args = Array.prototype.slice.call(arguments)

  var event = {
    type: type,
    args: []
  }

  for(var i = 1; i < args.length; i++) {
    event.args.push(this._remotePrivateFieldsFromObject(args[i]))
  }

  try {
    // this will get picked up by the wrapping ProcessInfo object and turned back into an event
    process.send(event)
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
