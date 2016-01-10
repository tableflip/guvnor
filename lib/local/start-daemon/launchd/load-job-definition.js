var childProcess = require('child_process')
var logger = require('winston')
var config = require('../../config')

module.exports = function loadJobDefinition (callback) {
  logger.debug('Running launchctl load /Library/LaunchDaemons/' + config.DAEMON_NAME + '.plist')

  childProcess.execFile('launchctl', ['load', '/Library/LaunchDaemons/' + config.DAEMON_NAME + '.plist'], function (error, stdout, stderr) {
    if (stdout) {
      logger.debug(stdout)
    }

    if (stderr) {
      logger.debug(stderr)
    }

    callback(error)
  })
}
