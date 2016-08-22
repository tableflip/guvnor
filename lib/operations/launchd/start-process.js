'use strict'

const execFile = require('mz/child-process').execFile
const config = require('./config')
const path = require('path')
const operations = require('../')
const ensureNotRunning = require('../common/lib/ensure-not-running')
const DEBUG = require('good-enough').DEBUG
const CONTEXT = 'operations:launchd:start-process'

const launchdStartProcess = (context, name, callback) => {
  context.log([DEBUG, CONTEXT], `starting process ${name}`)

  return ensureNotRunning(context, name)
  .then(() => startProcess(context, name))
  .then(() => operations.findProcess(context, name))
}

const startProcess = (context, name, next) => {
  context.log([DEBUG, CONTEXT], `running ${config.LAUNCHCTL_PATH} load -w ${path.join(config.PLIST_LOCATIONS, `${config.DAEMON_NAME}.${name}.plist`)}`)
  return execFile(config.LAUNCHCTL_PATH, ['load', '-w', path.join(config.PLIST_LOCATIONS, `${config.DAEMON_NAME}.${name}.plist`)])
}

module.exports = launchdStartProcess
