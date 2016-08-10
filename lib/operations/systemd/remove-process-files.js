'use strict'

const fs = require('fs')
const path = require('path')
const config = require('./config')
const async = require('async')
const child_process = require('child_process')
const DEBUG = require('good-enough').DEBUG
const CONTEXT = 'operations:systemd:remove-process-files'

function exec (command, args, callback) {
  child_process.execFile(command, args, function (error) {
    return callback(error)
  })
}

module.exports = function systemdRemoveProcessFiles (context, name, callback) {
  context.log([DEBUG, CONTEXT], `Removing files for ${name}`)

  const files = [
    path.join(config.UNIT_FILE_LOCATIONS, `${config.DAEMON_NAME}.${name}.service`),
    path.join(config.UNIT_FILE_LOCATIONS, `${config.DAEMON_NAME}.${name}.env`),
    path.join(config.UNIT_FILE_LOCATIONS, `${config.DAEMON_NAME}.${name}.key`),
    path.join(config.UNIT_FILE_LOCATIONS, `${config.DAEMON_NAME}.${name}.cert`),
    path.join(config.UNIT_FILE_LOCATIONS, `${config.DAEMON_NAME}.${name}.ca`)
  ]

  context.log([DEBUG, CONTEXT], `Removing ${files}`)

  async.waterfall([
    exec.bind(null, config.SYSTEMCTL_PATH, ['disable', `${config.DAEMON_NAME}.${name}`]),
    function (next) {
      async.parallel(files.map(function (file) {
        return fs.unlink.bind(fs, file)
      }), function (error) {
        next(error)
      })
    },
    exec.bind(null, config.SYSTEMCTL_PATH, ['daemon-reload'])
  ], (error) => {
    callback(error)
  })
}
