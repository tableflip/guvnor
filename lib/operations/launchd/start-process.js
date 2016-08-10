'use strict'

const async = require('async')
const child_process = require('child_process')
const config = require('./config')
const path = require('path')
const operations = require('../')
const ensureNotRunning = require('../common/lib/ensure-not-running')
const DEBUG = require('good-enough').DEBUG
const CONTEXT = 'operations:launchd:start-process'

module.exports = function launchdStartProcess (context, name, callback) {
  context.log([DEBUG, CONTEXT], `starting process ${name}`)

  async.waterfall([
    ensureNotRunning.bind(null, context, name),
    loadPlist.bind(null, context, name),
    function () {
      operations.findProcess(context, name, arguments[arguments.length - 1])
    }
  ], (error, results) => {
    callback(error, error ? undefined : results)
  })
}

const loadPlist = (context, name, next) => {
  context.log([DEBUG, CONTEXT], `running ${config.LAUNCHCTL_PATH} load -w ${path.join(config.PLIST_LOCATIONS, `${config.DAEMON_NAME}.${name}.plist`)}`)
  child_process.execFile(config.LAUNCHCTL_PATH, ['load', '-w', path.join(config.PLIST_LOCATIONS, `${config.DAEMON_NAME}.${name}.plist`)], next)
}
