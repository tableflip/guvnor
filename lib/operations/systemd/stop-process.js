var childProcess = require('child_process')
var logger = require('winston')
var config = require('./config')

module.exports = function systemdStopProcess (user, name, callback) {
  logger.debug('running systemctl stop guvnor.' + name)

  childProcess.execFile(config.SYSTEMCTL_PATH, ['stop', 'guvnor.' + name], function (error, stdout, stderr) {
    if (stdout) {
      logger.debug(stdout.trim())
    }

    if (stderr) {
      logger.warn(stderr.trim())
    }

    callback(error)
  })
}
