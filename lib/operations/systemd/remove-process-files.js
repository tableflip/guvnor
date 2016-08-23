'use strict'

const fs = require('fs-promise')
const path = require('path')
const config = require('./config')
const execFile = require('mz/child_process').execFile
const DEBUG = require('good-enough').DEBUG
const CONTEXT = 'operations:systemd:remove-process-files'

const systemdRemoveProcessFiles = (context, name, callback) => {
  context.log([DEBUG, CONTEXT], `Removing files for ${name}`)

  const files = [
    path.join(config.UNIT_FILE_LOCATIONS, `${config.DAEMON_NAME}.${name}.service`),
    path.join(config.UNIT_FILE_LOCATIONS, `${config.DAEMON_NAME}.${name}.env`),
    path.join(config.UNIT_FILE_LOCATIONS, `${config.DAEMON_NAME}.${name}.key`),
    path.join(config.UNIT_FILE_LOCATIONS, `${config.DAEMON_NAME}.${name}.cert`),
    path.join(config.UNIT_FILE_LOCATIONS, `${config.DAEMON_NAME}.${name}.ca`)
  ]

  context.log([DEBUG, CONTEXT], `Removing ${files}`)

  return execFile(config.SYSTEMCTL_PATH, ['disable', `${config.DAEMON_NAME}.${name}`])
  .then(() => Promise.all(files.map(file => fs.unlink(file))))
  .then(() => execFile(config.SYSTEMCTL_PATH, ['daemon-reload']))
  .then(() => {})
}

module.exports = systemdRemoveProcessFiles
