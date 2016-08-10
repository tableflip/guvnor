'use strict'

const childProcess = require('child_process')
const logger = require('winston')
const config = require('../../config')

module.exports = (callback) => {
  logger.debug(`Running launchctl load /Library/LaunchDaemons/${config.DAEMON_NAME}.plist`)

  childProcess.execFile('launchctl', ['load', `/Library/LaunchDaemons/${config.DAEMON_NAME}.plist`], (error, stdout, stderr) => {
    if (stdout) {
      logger.debug(stdout)
    }

    if (stderr) {
      logger.debug(stderr)
    }

    callback(error)
  })
}
