'use strict'

const async = require('async')
const child_process = require('child_process')
const config = require('./config')
const operations = require('../')
const ensureNotRunning = require('../common/lib/ensure-not-running')
const DEBUG = require('good-enough').DEBUG
const CONTEXT = 'operations:systemd:start-process'

module.exports = function systemdStartProcess (context, name, callback) {
  context.log([DEBUG, CONTEXT], `Starting process ${name}`)

  async.waterfall([
    ensureNotRunning.bind(null, context, name),
    function (next) {
      context.log([DEBUG, CONTEXT], `running ${config.SYSTEMCTL_PATH} daemon-reload`)
      context.log([DEBUG, CONTEXT], `running ${config.SYSTEMCTL_PATH} enable ${config.DAEMON_NAME}.${name}`)
      context.log([DEBUG, CONTEXT], `running ${config.SYSTEMCTL_PATH} start ${config.DAEMON_NAME}.${name}`)

      async.series([
        child_process.execFile.bind(child_process, config.SYSTEMCTL_PATH, ['daemon-reload']),
        child_process.execFile.bind(child_process, config.SYSTEMCTL_PATH, ['enable', `${config.DAEMON_NAME}.${name}`]),
        child_process.execFile.bind(child_process, config.SYSTEMCTL_PATH, ['start', `${config.DAEMON_NAME}.${name}`])
      ], next)
    },
    function () {
      operations.findProcess(context, name, arguments[arguments.length - 1])
    }
  ], (error, results) => {
    callback(error, error ? undefined : results)
  })
}
