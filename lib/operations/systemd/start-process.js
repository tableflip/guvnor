'use strict'

const execFile = require('mz/child_process').execFile
const config = require('./config')
const operations = require('../')
const ensureNotRunning = require('../common/lib/ensure-not-running')
const DEBUG = require('good-enough').DEBUG
const CONTEXT = 'operations:systemd:start-process'

module.exports = function systemdStartProcess (context, name, callback) {
  context.log([DEBUG, CONTEXT], `Starting process ${name}`)
  context.log([DEBUG, CONTEXT], `running ${config.SYSTEMCTL_PATH} daemon-reload`)
  context.log([DEBUG, CONTEXT], `running ${config.SYSTEMCTL_PATH} enable ${config.DAEMON_NAME}.${name}`)
  context.log([DEBUG, CONTEXT], `running ${config.SYSTEMCTL_PATH} start ${config.DAEMON_NAME}.${name}`)

  return ensureNotRunning(context, name)
  .then(() => execFile(config.SYSTEMCTL_PATH, ['daemon-reload']))
  .then(() => execFile(config.SYSTEMCTL_PATH, ['enable', `${config.DAEMON_NAME}.${name}`]))
  .then(() => execFile(config.SYSTEMCTL_PATH, ['start', `${config.DAEMON_NAME}.${name}`]))
  .then(() => operations.findProcess(context, name))
}
