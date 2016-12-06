'use strict'

const fs = require('fs-promise')
const config = require('../config')

const launchdListDaemonPlists = () => {
  return fs.readdir(config.PLIST_LOCATIONS)
  .then(files => files.filter(file => file.substring(0, config.DAEMON_NAME.length + 1) === `${config.DAEMON_NAME}.`))
}

module.exports = launchdListDaemonPlists
