var fs = require('fs')
var path = require('path')
var config = require('./config')
var async = require('async')
var child_process = require('child_process')
var DEBUG = require('good-enough').DEBUG
var CONTEXT = 'operations:systemd:remove-process-files'

function exec (command, args, callback) {
  child_process.execFile(command, args, function (error) {
    return callback(error)
  })
}

module.exports = function systemdRemoveProcessFiles (context, name, callback) {
  context.log([DEBUG, CONTEXT], 'Removing files for ' + name)

  var files = [
    path.join(config.UNIT_FILE_LOCATIONS, config.DAEMON_NAME + '.' + name + '.service'),
    path.join(config.UNIT_FILE_LOCATIONS, config.DAEMON_NAME + '.' + name + '.env'),
    path.join(config.UNIT_FILE_LOCATIONS, config.DAEMON_NAME + '.' + name + '.key'),
    path.join(config.UNIT_FILE_LOCATIONS, config.DAEMON_NAME + '.' + name + '.cert'),
    path.join(config.UNIT_FILE_LOCATIONS, config.DAEMON_NAME + '.' + name + '.ca')
  ]

  context.log([DEBUG, CONTEXT], 'Removing ' + files)

  async.waterfall([
    exec.bind(null, config.SYSTEMCTL_PATH, ['disable', config.DAEMON_NAME + '.' + name]),
    function (next) {
      async.parallel(files.map(function (file) {
        return fs.unlink.bind(fs, file)
      }), function (error) {
        next(error)
      })
    },
    exec.bind(null, config.SYSTEMCTL_PATH, ['daemon-reload'])
  ], function (error) {
    callback(error)
  })
}
