var Transport = require('winston').Transport,
  util = require('util')

var RemoteProcessLogger = function() {
  Transport.call(this)
}
util.inherits(RemoteProcessLogger, Transport)

RemoteProcessLogger.prototype.name = 'console';

RemoteProcessLogger.prototype.log = function (level, msg, meta, callback) {
  if(this.silent || !process.send) {
    return callback(null, true)
  }

  if(level === 'error' || level === 'debug') {
    process.send({type: 'log:stderr', message: msg.trim()});
  } else {
    process.send({type: 'log:stdout', message: msg.trim()});
  }

  this.emit('logged');
  callback(null, true);
};

module.exports = RemoteProcessLogger
