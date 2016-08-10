'use strict'

const childProcess = require('child_process')
const config = require('./config')
const path = require('path')
const DEBUG = require('good-enough').DEBUG
const WARN = require('good-enough').WARN
const CONTEXT = 'operations:launchd:stop-process'

module.exports = function launchdStopProcess (context, name, callback) {
  const plist = path.join(config.PLIST_LOCATIONS, `${config.DAEMON_NAME}.${name}.plist`)

  context.log([DEBUG, CONTEXT], `running launchctl unload -w ${plist}`)

  childProcess.execFile(config.LAUNCHCTL_PATH, ['unload', '-w', plist], (error, stdout, stderr) => {
    if (stdout) {
      context.log([DEBUG, CONTEXT], stdout.trim())
    }

    if (stderr) {
      context.log([WARN, CONTEXT], stderr.trim())
    }

    callback(error)
  })
}
