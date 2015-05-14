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

    callback(undefined, {
      pid: process.pid,
      uid: process.getuid(),
      gid: process.getgid(),
      name: process.title,
      uptime: process.uptime(),
      cpu: result ? result.cpu : 0,
      heapTotal: memory.heapTotal,
      heapUsed: memory.heapUsed,
      residentSize: memory.rss,
      time: Date.now(),
      cwd: process.cwd(),
      argv: process.argv,
      execArgv: process.execArgv,
      latency: Math.max(0, lag())
    })
  })
}
