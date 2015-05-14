var stop = require('../../../common/launchd/operations/stop')
var logger = require('winston')

module.exports = function stopDaemon (callback) {
  logger.debug('Stopping daemon')

  stop('guvnor', callback)
}
