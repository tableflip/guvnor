'use strict'

const execFile = require('child_process').execFile
const config = require('../config')

module.exports = function launchdAllProcesses (callback) {
  execFile(config.LAUNCHCTL_PATH, ['list'], function launchctlList (error, stdout) {
    if (error) {
      return callback(error)
    }

    const processes = []

    stdout.split(/\n/g).some(function eachLine (line, index) {
      if (index === 0) {
        return
      }

      const parts = line.trim().split(/\s+/)

      const proc = {
        pid: parseInt(parts[0], 10),
        exitCode: parseInt(parts[1], 10),
        name: parts[2]
      }

      if (isNaN(proc.pid)) {
        delete proc.pid
      }

      if (proc.name === undefined) {
        return
      }

      if (proc.name.substring(0, config.DAEMON_NAME.length + 1) !== `${config.DAEMON_NAME}.`) {
        return
      }

      proc.name = proc.name.substring(7)

      processes.push(proc)
    })

    callback(null, processes)
  })
}
