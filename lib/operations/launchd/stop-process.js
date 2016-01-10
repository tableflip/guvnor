var childProcess = require('child_process')
var config = require('./config')
var path = require('path')
var DEBUG = require('good-enough').DEBUG
var WARN = require('good-enough').WARN
var CONTEXT = 'operations:launchd:stop-process'

module.exports = function launchdStopProcess (context, name, callback) {
  var plist = path.join(config.PLIST_LOCATIONS, config.DAEMON_NAME + '.' + name + '.plist')

  context.log([DEBUG, CONTEXT], 'running launchctl unload -w ' + plist)

  childProcess.execFile(config.LAUNCHCTL_PATH, ['unload', '-w', plist], function (error, stdout, stderr) {
    if (stdout) {
      context.log([DEBUG, CONTEXT], stdout.trim())
    }

    if (stderr) {
      context.log([WARN, CONTEXT], stderr.trim())
    }

    callback(error)
  })
}
