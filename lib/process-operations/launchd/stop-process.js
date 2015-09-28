var childProcess = require('child_process')
var logger = require('winston')
var config = require('./config')
var path = require('path')

module.exports = function launchdStopProcess (user, name, callback) {
  var plist = path.join(config.PLIST_LOCATIONS, 'guvnor.' + name + '.plist')

  logger.debug('running launchctl unload -w', plist)

  childProcess.execFile(config.LAUNCHCTL_PATH, ['unload', '-w', plist], function (error, stdout, stderr) {
    if (stdout) {
      logger.debug(stdout.trim())
    }

    if (stderr) {
      logger.warn(stderr.trim())
    }

    callback(error)
  })
}
