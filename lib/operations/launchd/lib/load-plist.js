'use strict'

const plist = require('plist')
const fs = require('fs-promise')
const config = require('../config')
const path = require('path')

const PLIST_SUFFIX = '.plist'
const DAEMON_PREFIX = `${config.DAEMON_NAME}.`

const launchdLoadPlist = (processName) => {
  if (processName.substring(processName.length - PLIST_SUFFIX.length) !== PLIST_SUFFIX) {
    processName += PLIST_SUFFIX
  }

  if (processName.substring(0, DAEMON_PREFIX.length) !== DAEMON_PREFIX) {
    processName = DAEMON_PREFIX + processName
  }

  const file = path.join(config.PLIST_LOCATIONS, processName)

  return fs.readFile(file, 'utf8')
  .then(contents => plist.parse(contents))
}

module.exports = launchdLoadPlist
