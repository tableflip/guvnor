var usage = require('usage')
var lag = require('event-loop-lag')(1000)

module.exports = function (callback) {
  usage.lookup(process.pid, {
    keepHistory: true
  }, function (error, result) {
    if (error) {
      return callback(error)
    }

    var memory = process.memoryUsage()

    callback(null, {
      pid: process.pid,
      uid: process.getuid(),
      gid: process.getgid(),
      uptime: process.uptime(),
      cpu: result ? result.cpu : 0,
      heapTotal: memory.heapTotal,
      heapUsed: memory.heapUsed,
      residentSize: memory.rss,
      cwd: process.cwd(),
      latency: Math.max(0, lag()),
      argv: process.argv,
      execArgv: process.execArgv
    })
  })
}
