var async = require('async')
var child_process = require('child_process')
var config = require('./config')
var operations = require('../')
var ensureNotRunning = require('../common/lib/ensure-not-running')
var DEBUG = require('good-enough').DEBUG
var CONTEXT = 'operations:systemd:start-process'

module.exports = function systemdStartProcess (context, name, callback) {
  context.log([DEBUG, CONTEXT], 'Starting process ' + name)

  async.waterfall([
    ensureNotRunning.bind(null, context, name),
    function (next) {
      context.log([DEBUG, CONTEXT], 'running ' + config.SYSTEMCTL_PATH + ' daemon-reload')
      context.log([DEBUG, CONTEXT], 'running ' + config.SYSTEMCTL_PATH + ' enable guvnor.' + name)
      context.log([DEBUG, CONTEXT], 'running ' + config.SYSTEMCTL_PATH + ' start guvnor.' + name)

      async.series([
        child_process.execFile.bind(child_process, config.SYSTEMCTL_PATH, ['daemon-reload']),
        child_process.execFile.bind(child_process, config.SYSTEMCTL_PATH, ['enable', 'guvnor.' + name]),
        child_process.execFile.bind(child_process, config.SYSTEMCTL_PATH, ['start', 'guvnor.' + name])
      ], next)
    },
    function () {
      operations.findProcess(context, name, arguments[arguments.length - 1])
    }
  ], function (error, proc) {
    callback(error, proc)
  })
}
