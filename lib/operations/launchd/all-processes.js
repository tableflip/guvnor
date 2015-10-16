var child_process = require('child_process')
var logger = require('winston')
var config = require('./config')

module.exports = function launchdAllProcesses (callback) {
  logger.debug('Listing launchd processes')

  child_process.execFile(config.LAUNCHCTL_PATH, ['list'], function launchctlList (error, stdout) {
    if (error) {
      return callback(error)
    }

    var processes = []

    stdout.split(/\n/g).some(function eachLine (line, index) {
      if (index === 0) {
        // logger.debug(line)
        return
      }

      var parts = line.trim().split(/\s+/)

      var proc = {
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

      if (proc.name.substring(0, 7) !== 'guvnor.') {
        return
      }

      // logger.debug('%s\t%d\t%s', proc.pid || '-', proc.exitCode, proc.name)

      processes.push(proc)
    })

    callback(null, processes)
  })
}
