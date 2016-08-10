'use strict'

const fs = require('fs')
const path = require('path')
const config = require('./config')
const DEBUG = require('good-enough').DEBUG
const CONTEXT = 'operations:launchd:remove-process-files'
const async = require('async')

module.exports = (context, name, callback) => {
  async.parallel([
    removePlist.bind(null, context, name),
    removeLogRotation.bind(null, context, name)
  ], function launchdRemovedProcessFiles (error) {
    callback(error)
  })
}

const removePlist = (context, name, callback) => {
  const plist = path.join(config.PLIST_LOCATIONS, `${config.DAEMON_NAME}.${name}.plist`)

  context.log([DEBUG, CONTEXT], `Removing ${plist}`)

  fs.unlink(plist, callback)
}

const removeLogRotation = (context, name, callback) => {
  const rotateFile = path.join(config.NEWSYSLOGD_PATH, `${config.DAEMON_NAME}.${name}.conf`)

  context.log([DEBUG, CONTEXT], `Removing ${rotateFile}`)

  fs.unlink(rotateFile, callback)
}
