var Autowire = require('wantsit').Autowire

var RemoteProcess = function() {
  this._logger = Autowire
}

RemoteProcess.prototype.send = function(event) {
  if(process.send) {
    process.send(event)
  } else {
    // invoked directly so print the message instead
    this._logger.info(event.type, event.message ? event.message : '')
  }
}

module.exports = RemoteProcess
