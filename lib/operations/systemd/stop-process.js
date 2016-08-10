'use strict'

const childProcess = require('child_process')
const config = require('./config')
const DEBUG = require('good-enough').DEBUG
const WARN = require('good-enough').WARN
const CONTEXT = 'operations:systemd:stop-process'

module.exports = function systemdStopProcess (context, name, callback) {
  context.log([DEBUG, CONTEXT], `running systemctl stop ${config.DAEMON_NAME}.${name}`)

  childProcess.execFile(config.SYSTEMCTL_PATH, ['stop', `${config.DAEMON_NAME}.${name}`], (error, stdout, stderr) => {
    if (stdout) {
      context.log([DEBUG, CONTEXT], stdout.trim())
    }

    if (stderr) {
      context.log([WARN, CONTEXT], stderr.trim())
    }

    callback(error)
  })
}
