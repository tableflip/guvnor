'use strict'

const fs = require('fs-promise')
const path = require('path')
const config = require('./config')
const DEBUG = require('good-enough').DEBUG
const CONTEXT = 'operations:launchd:remove-process-files'

const removeProcessFilesLaunchd = (context, name) => {
  return Promise.all([
    removePlist(context, name),
    removeLogRotation(context, name)
  ])
  .then(() => {})
}

const removePlist = (context, name) => {
  const plist = path.join(config.PLIST_LOCATIONS, `${config.DAEMON_NAME}.${name}.plist`)

  context.log([DEBUG, CONTEXT], `Removing ${plist}`)

  return fs.unlink(plist)
}

const removeLogRotation = (context, name) => {
  const rotateFile = path.join(config.NEWSYSLOGD_PATH, `${config.DAEMON_NAME}.${name}.conf`)

  context.log([DEBUG, CONTEXT], `Removing ${rotateFile}`)

  return fs.unlink(rotateFile)
}

module.exports = removeProcessFilesLaunchd
