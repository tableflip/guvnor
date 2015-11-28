var async = require('async')
var logger = require('winston')
var child_process = require('child_process')
var config = require('./config')
var path = require('path')
var operations = require('../')
var ensureNotRunning = require('../common/ensure-not-running')

module.exports = function launchdStartProcess (user, name, callback) {
  logger.debug('starting process %s', name)

  async.waterfall([
    ensureNotRunning.bind(null, user, name),
    function (next) {
      logger.debug('running', config.LAUNCHCTL_PATH, 'load', '-w', path.join(config.PLIST_LOCATIONS, 'guvnor.' + name + '.plist'))
      child_process.execFile(config.LAUNCHCTL_PATH, ['load', '-w', path.join(config.PLIST_LOCATIONS, 'guvnor.' + name + '.plist')], next)
    },
    function () {
      operations.findProcess(user, name, arguments[arguments.length - 1])
    }
  ], function (error, proc) {
    callback(error, proc)
  })
}
