var cpuStats = require('cpu-stats')
var os = require('os')
var pkg = require('../../../package.json')
var operations = require('../')
var async = require('async')

module.exports = function getServerStatus (context, callback) {
  async.parallel({
    cpuStats: cpuStats.bind(null, 1000),
    os: operations.getOs.bind(null, context)
  }, function (error, results) {
    var status = {
      hostname: os.hostname(),
      type: os.type(),
      platform: os.platform(),
      arch: os.arch(),
      release: os.release(),
      daemon: pkg.version,
      time: Date.now(),
      uptime: os.uptime(),
      freeMemory: os.freemem(),
      totalMemory: os.totalmem(),
      cpus: os.cpus(),
      versions: process.versions
      // ,
      // debuggerPort: this._config.remote.inspector.enabled ? this._nodeInspectorWrapper.debuggerPort : undefined
    }

    if (!error) {
      results.cpuStats.forEach(function (load, index) {
        status.cpus[index].load = load
      })

      status.os = results.os
    }

    callback(error, status)
  })
}
