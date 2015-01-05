var Transport = require('winston').Transport,
  util = require('util'),
  Autowire = require('wantsit').Autowire

var DaemonLogger = function() {
  Transport.call(this, {level: 'debug'})

  this._userRpc = Autowire
  this._adminRpc = Autowire
  this._logger = Autowire
}
util.inherits(DaemonLogger, Transport)

DaemonLogger.prototype.name = 'daemon';

DaemonLogger.prototype.log = function (level, msg, meta, callback) {
  if(this.silent || !process.send) {
    return callback(null, true)
  }

  this._userRpc.broadcast('boss:log:' + level, {
    date: Date.now(),
    message: ("" + msg).trim()
  })

  this.emit('logged');
  callback(null, true);
}

module.exports = DaemonLogger
