var async = require('async')
var isProcessRunning = require('./is-process-running')
var logger = require('winston')
var child_process = require('child_process')
var config = require('./config')
var path = require('path')
var processOperations = require('../')

module.exports = function launchdStartProcess (user, name, callback) {
  logger.debug('starting process %s', name)

  async.waterfall([
    isProcessRunning.bind(null, 'guvnor.' + name),
    function isRunning (running, next) {
      var error

      if (running) {
        error = new Error(name + ' is already running!')
        error.code = 'ERUNNING'
      }

      next(error)
    },
    function (next) {
      logger.debug('running', config.LAUNCHCTL_PATH, 'load', '-w', path.join(config.PLIST_LOCATIONS, 'guvnor.' + name + '.plist'))
      child_process.execFile(config.LAUNCHCTL_PATH, ['load', '-w', path.join(config.PLIST_LOCATIONS, 'guvnor.' + name + '.plist')], next)
    },
    function () {
      processOperations.findProcess(user, name, arguments[arguments.length - 1])
    }
  ], function (error, proc) {
    callback(error, proc)
  })
}
