var async = require('async')
var child_process = require('child_process')
var config = require('./config')
var path = require('path')
var operations = require('../')
var ensureNotRunning = require('../common/lib/ensure-not-running')
var DEBUG = require('good-enough').DEBUG
var CONTEXT = 'operations:launchd:start-process'

module.exports = function launchdStartProcess (context, name, callback) {
  context.log([DEBUG, CONTEXT], 'starting process ' + name)

  async.waterfall([
    ensureNotRunning.bind(null, context, name),
    function (next) {
      context.log([DEBUG, CONTEXT], 'running ' + config.LAUNCHCTL_PATH + ' load -w ' + path.join(config.PLIST_LOCATIONS, 'guvnor.' + name + '.plist'))
      child_process.execFile(config.LAUNCHCTL_PATH, ['load', '-w', path.join(config.PLIST_LOCATIONS, 'guvnor.' + name + '.plist')], next)
    },
    function () {
      operations.findProcess(context, name, arguments[arguments.length - 1])
    }
  ], function (error, proc) {
    callback(error, proc)
  })
}
