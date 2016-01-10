var isProcessRunning = require('../../../common/launchd/is-process-running')
var config = require('../../../config')

module.exports = function isDaemonRunning (callback) {
  isProcessRunning(config.DAEMON_NAME, callback)
}
