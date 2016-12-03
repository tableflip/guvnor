'use strict'

const usage = require('usage')
const lag = require('event-loop-lag')(1000)

const reportStatus = () => {
  return new Promise((resolve, reject) => {
    usage.lookup(process.pid, {
      keepHistory: true
    }, function (error, result) {
      if (error) {
        return reject(error)
      }

      const memory = process.memoryUsage()
      const cpu = parseFloat(result && result.cpu ? result.cpu : 0)

      resolve({
        pid: process.pid,
        uid: process.getuid(),
        gid: process.getgid(),
        uptime: process.uptime(),
        cpu: isNaN(cpu) ? 0 : cpu,
        heapTotal: memory.heapTotal,
        heapUsed: memory.heapUsed,
        residentSize: memory.rss,
        cwd: process.cwd(),
        latency: Math.max(0, lag()),
        argv: process.argv,
        execArgv: process.execArgv,
        env: process.env
      })
    })
  })
}

module.exports = reportStatus
