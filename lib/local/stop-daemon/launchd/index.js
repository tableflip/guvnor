'use strict'

const logger = require('winston')
const stop = require('../../../common/launchd/operations/stop')
const config = require('../../config')

module.exports = function stopDaemon (callback) {
  logger.debug('Stopping daemon')
  stop(config.DAEMON_NAME, callback)
}
