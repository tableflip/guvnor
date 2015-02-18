var Autowire = require('wantsit').Autowire

var LatencyMonitor = function() {
  this._lag = Autowire
}

LatencyMonitor.prototype.afterPropertiesSet = function() {
  var lag = this._lag(1000)

  Object.defineProperty(this, 'latency', {
    get: function() {
      return Math.max(0, lag())
    }.bind(this)
  })
}

module.exports = LatencyMonitor
