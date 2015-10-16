var async = require('async')
var logger = require('winston')
var child_process = require('child_process')
var config = require('./config')
var path = require('path')
var processOperations = require('../')
var PROCESS_STATUS = require('../../common/process-status')

module.exports = function systemdStartProcess (user, name, callback) {
  logger.debug('Starting process %s', name)

  async.waterfall([
    processOperations.getBasicProcess.bind(null, user, name),
    function isRunning (proc, next) {
      var error

      if (proc.status === PROCESS_STATUS.RUNNING) {
        error = new Error(name + ' is already running!')
        error.code = 'ERUNNING'
      }

      next(error)
    },
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
      processOperations.getProcess(user, name, arguments[arguments.length - 1])
    }
  ], function (error, proc) {
    callback(error, proc)
  })
}
