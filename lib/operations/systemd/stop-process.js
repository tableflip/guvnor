var childProcess = require('child_process')
var config = require('./config')
var DEBUG = require('good-enough').DEBUG
var WARN = require('good-enough').WARN
var CONTEXT = 'operations:systemd:stop-process'

module.exports = function systemdStopProcess (context, name, callback) {
  context.log([DEBUG, CONTEXT], 'running systemctl stop guvnor.' + name)

  childProcess.execFile(config.SYSTEMCTL_PATH, ['stop', 'guvnor.' + name], function (error, stdout, stderr) {
    if (stdout) {
      context.log([DEBUG, CONTEXT], stdout.trim())
    }

    if (stderr) {
      context.log([WARN, CONTEXT], stderr.trim())
    }

    callback(error)
  })
}
