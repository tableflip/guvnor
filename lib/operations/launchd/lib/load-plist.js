'use strict'

const async = require('async')
const plist = require('plist')
const fs = require('fs')
const config = require('../config')
const path = require('path')

const PLIST_SUFFIX = '.plist'
const DAEMON_PREFIX = `${config.DAEMON_NAME}.`

module.exports = function launchdLoadPlist (processName, callback) {
  if (processName.substring(processName.length - PLIST_SUFFIX.length) !== PLIST_SUFFIX) {
    processName += PLIST_SUFFIX
  }

  if (processName.substring(0, DAEMON_PREFIX.length) !== DAEMON_PREFIX) {
    processName = DAEMON_PREFIX + processName
  }

  const file = path.join(config.PLIST_LOCATIONS, processName)

  async.waterfall([
    fs.readFile.bind(fs, file, 'utf8'),
    async.asyncify(plist.parse)
  ], callback)
}
