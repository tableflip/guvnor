var Transport = require('winston').Transport,
  util = require('util'),
  Autowire = require('wantsit').Autowire

var RemoteProcessLogger = function(options) {
  Transport.call(this, options)

  this._parentProcess = Autowire
}
util.inherits(RemoteProcessLogger, Transport)

RemoteProcessLogger.prototype.name = 'remote';

RemoteProcessLogger.prototype.log = function(level, msg, meta, callback) {
  if(this.silent) {
    return callback(null, true)
  }

  if(msg) {
    this._parentProcess.send('process:log:' + level, {
      date: Date.now(),
      message: msg.toString().trim()
    })

    this.emit('logged');
  }

  callback(null, true);
}

module.exports = RemoteProcessLogger
