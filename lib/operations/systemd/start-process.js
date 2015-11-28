var async = require('async')
var logger = require('winston')
var child_process = require('child_process')
var config = require('./config')
var operations = require('../')
var ensureNotRunning = require('../common/ensure-not-running')

module.exports = function systemdStartProcess (user, name, callback) {
  logger.debug('Starting process %s', name)

  async.waterfall([
    ensureNotRunning.bind(null, user, name),
    function (next) {
      logger.debug('running', config.SYSTEMCTL_PATH, 'daemon-reload')
      logger.debug('running', config.SYSTEMCTL_PATH, 'start', 'guvnor.' + name)

      async.series([
        child_process.execFile.bind(child_process, config.SYSTEMCTL_PATH, ['daemon-reload']),
        child_process.execFile.bind(child_process, config.SYSTEMCTL_PATH, ['enable', 'guvnor.' + name]),
        child_process.execFile.bind(child_process, config.SYSTEMCTL_PATH, ['start', 'guvnor.' + name])
      ], next)
    },
    function () {
      operations.findProcess(user, name, arguments[arguments.length - 1])
    }
  ], function (error, proc) {
    callback(error, proc)
  })
}
