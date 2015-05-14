var isProcessRunning = require('../../../common/launchd/is-process-running')

module.exports = function isDaemonRunning (callback) {
  isProcessRunning('guvnor', callback)
}
