var Autowire = require('wantsit').Autowire

var LatencyMonitor = function() {
  this._monitor = Autowire
  this.latency = {
    p50: 0, p90: 0, p95: 0, p99: 0, p100: 0
  }
}

LatencyMonitor.prototype.afterPropertiesSet = function() {
  this._monitor.on('data', function(latency) {
    this.latency = latency
  }.bind(this))
  this._monitor.resume()
}

module.exports = LatencyMonitor
