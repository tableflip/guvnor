var logger = require('winston')
var stop = require('../../../common/launchd/operations/stop')
var config = require('../../config')

module.exports = function stopDaemon (callback) {
  logger.debug('Stopping daemon')
  stop(config.DAEMON_NAME, callback)
}
