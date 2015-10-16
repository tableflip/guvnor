var cpuStats = require('cpu-stats')
var os = require('os')

module.exports = function getServerStatus (user, callback) {
  cpuStats(1000, function (error, stats) {
    var status = {
      time: Date.now(),
      uptime: os.uptime(),
      freeMemory: os.freemem(),
      totalMemory: os.totalmem(),
      cpus: os.cpus()//,
      //debuggerPort: this._config.remote.inspector.enabled ? this._nodeInspectorWrapper.debuggerPort : undefined
    }

    if (!error) {
      stats.forEach(function (load, index) {
        status.cpus[index].load = load
      })
    }

    callback(error, status)
  })
}
