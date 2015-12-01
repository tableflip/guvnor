var childProcess = require('child_process')
var logger = require('winston')

module.exports = function loadJobDefinition (callback) {
  logger.debug('Running launchctl load /Library/LaunchDaemons/guvnor.plist')

  childProcess.execFile('launchctl', ['load', '/Library/LaunchDaemons/guvnor.plist'], function (error, stdout, stderr) {
    if (stdout) {
      logger.debug(stdout)
    }

    if (stderr) {
      logger.debug(stderr)
    }

    callback(error)
  })
}
