var logger = require('winston')
var fs = require('fs')
var path = require('path')
var config = require('./config')
var processOperations = require('../')
var async = require('async')
var child_process = require('child_process')

function exec (command, args, callback) {
console.info(arguments)
  child_process.execFile(command, args, function (error) {
    return callback(error)
  })
}

module.exports = function systemdRemoveProcessFiles (user, name, callback) {
  logger.debug('Removing', name)

  var files = [
    path.join(config.UNIT_FILE_LOCATIONS, 'guvnor.' + name + '.service'),
    path.join(config.UNIT_FILE_LOCATIONS, 'guvnor.' + name + '.env'),
    path.join(config.UNIT_FILE_LOCATIONS, 'guvnor.' + name + '.key'),
    path.join(config.UNIT_FILE_LOCATIONS, 'guvnor.' + name + '.cert'),
    path.join(config.UNIT_FILE_LOCATIONS, 'guvnor.' + name + '.ca')
  ]

  logger.debug('Removing', files)

  async.waterfall([
    exec.bind(null, config.SYSTEMCTL_PATH, ['disable', 'guvnor.' + name]),
    function (next) {
      async.parallel(files.map(function (file) {
        return fs.unlink.bind(fs, file)
      }), function (error) {
        next(error)
      })
    },
    exec.bind(null, config.SYSTEMCTL_PATH, ['daemon-reload']),
  ], function (error) {
    callback(error)
  })
}
