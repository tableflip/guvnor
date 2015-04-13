var util = require('util')
var EventEmitter = require('wildemitter')

var ManagedApp = function (info, daemon) {
  EventEmitter.call(this, {
    wildcard: true,
    delimiter: ':'
  })

  // we're going to make the callbacks object non-enumerable
  delete this.callbacks

  Object.defineProperties(this, {
    callbacks: {
      value: {},
      writable: false
    }
  })

  this.update(info)

  this.switchRef = daemon.switchApplicationRef.bind(daemon, this.name)
  this.listRefs = daemon.listApplicationRefs.bind(daemon, this.name)
  this.updateRefs = daemon.updateApplicationRefs.bind(daemon, this.name)
  this.currentRef = daemon.currentRef.bind(daemon, this.name)
}
util.inherits(ManagedApp, EventEmitter)

ManagedApp.prototype.update = function (info) {
  if (!info) {
    return
  }

  for (var key in info) {
    this[key] = info[key]
  }
}

module.exports = ManagedApp
