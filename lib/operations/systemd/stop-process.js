'use strict'

const execFile = require('child-process-promise').execFile
const config = require('./config')
const operations = require('../')
const DEBUG = require('good-enough').DEBUG
const WARN = require('good-enough').WARN
const CONTEXT = 'operations:systemd:stop-process'

module.exports = function systemdStopProcess (context, name, callback) {
  context.log([DEBUG, CONTEXT], `running systemctl stop ${config.DAEMON_NAME}.${name}`)

  return execFile(config.SYSTEMCTL_PATH, ['stop', `${config.DAEMON_NAME}.${name}`])
  .then(results => {
    if (results.stdout && results.stdout.trim()) {
      context.log([DEBUG, CONTEXT], results.stdout.trim())
    }

    if (results.stderr && results.stderr.trim()) {
      context.log([WARN, CONTEXT], results.stderr.trim())
    }

    return operations.findProcess(context, name)
  })
}
