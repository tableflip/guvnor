var Autowire = require('wantsit').Autowire

var MessageHandler = function() {
  this._parentProcess = Autowire
  this._usage = Autowire
}

MessageHandler.prototype.afterPropertiesSet = function() {
  this._parentProcess.on('message', function(event) {
    if(!event || !event.type) {
      return
    }

    if(this[event.type]) {
      this[event.type](event)
    }
  }.bind(this))
}

MessageHandler.prototype['boss:status'] = function() {
  this._usage.lookup(process.pid, {
    keepHistory: true
  }, function(err, result) {
    this._parentProcess.send({
      type: 'process:status',
      status: {
        pid: process.pid,
        uid: process.getuid(),
        gid: process.getgid(),
        title: process.title,
        uptime: process.uptime(),
        usage: {
          memory: process.memoryUsage(),
          cpu: result.cpu
        }
      }
    })
  }.bind(this))
}

module.exports = MessageHandler
