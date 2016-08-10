'use strict'

const isProcessRunning = require('../../../common/launchd/is-process-running')
const config = require('../../../config')

module.exports = function isDaemonRunning (callback) {
  isProcessRunning(config.DAEMON_NAME, callback)
}
