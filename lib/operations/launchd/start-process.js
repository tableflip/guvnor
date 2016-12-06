'use strict'

const execFile = require('mz/child_process').execFile
const config = require('./config')
const path = require('path')
const operations = require('../')
const ensureNotRunning = require('../common/lib/ensure-not-running')
const DEBUG = require('good-enough').DEBUG
const CONTEXT = 'operations:launchd:start-process'

const launchdStartProcess = (context, name) => {
  context.log([DEBUG, CONTEXT], `starting process ${name}`)

  return ensureNotRunning(context, name)
  .then(() => startProcess(context, name))
  .then(() => operations.findProcess(context, name))
}

const startProcess = (context, name, next) => {
  context.log([DEBUG, CONTEXT], `running ${config.LAUNCHCTL_PATH} load -w ${path.join(config.PLIST_LOCATIONS, `${config.DAEMON_NAME}.${name}.plist`)}`)

  return execFile(config.LAUNCHCTL_PATH, ['load', '-w', path.join(config.PLIST_LOCATIONS, `${config.DAEMON_NAME}.${name}.plist`)])
  .then(([stdout, stderr]) => {
    if (stdout) {
      context.log([DEBUG, CONTEXT], stdout.trim())
    }

    if (stderr) {
      context.log([WARN, CONTEXT], stderr.trim())
    }

    return operations.findProcess(context, name)
  })
}

module.exports = launchdStartProcess
