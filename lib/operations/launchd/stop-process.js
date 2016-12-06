'use strict'

const execFile = require('mz/child_process').execFile
const config = require('./config')
const path = require('path')
const DEBUG = require('good-enough').DEBUG
const WARN = require('good-enough').WARN
const CONTEXT = 'operations:launchd:stop-process'

const launchdStopProcess = (context, name) => {
  const plist = path.join(config.PLIST_LOCATIONS, `${config.DAEMON_NAME}.${name}.plist`)

  context.log([DEBUG, CONTEXT], `running launchctl unload -w ${plist}`)

  return execFile(config.LAUNCHCTL_PATH, ['unload', '-w', plist])
  .then(([stdout, stderr]) => {
    if (stdout) {
      context.log([DEBUG, CONTEXT], stdout.trim())
    }

    if (stderr) {
      context.log([WARN, CONTEXT], stderr.trim())
    }
  })
}

module.exports = launchdStopProcess
