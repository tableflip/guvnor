var daemonPlistName = require('../../../common/launchd/daemon-plist-name')
var childProcess = require('child_process')
var logger = require('winston')

module.exports = function loadJobDefinition (callback) {
  logger.debug('Running launchctl load', daemonPlistName())

  childProcess.execFile('launchctl', ['load', daemonPlistName()], function (error, stdout, stderr) {
    if (stdout) {
      logger.debug(stdout)
    }

    if (stderr) {
      logger.debug(stderr)
    }

    callback(error)
  })
}
