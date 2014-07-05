var Autowire = require('wantsit').Autowire

var ParentProcess = function() {
  this._logger = Autowire
}

ParentProcess.prototype.send = function(event) {
  if(process.send) {
    process.send(event)
  } else {
    // invoked directly so print the message instead
    this._logger.info(event.type, event.message ? event.message : '')
  }
}

ParentProcess.prototype.on = function(event, listener) {
  if(process.send) {
    process.on(event, listener)
  }
}

ParentProcess.prototype.once = function(event, listener) {
  if(process.send) {
    process.once(event, listener)
  }
}

module.exports = ParentProcess
