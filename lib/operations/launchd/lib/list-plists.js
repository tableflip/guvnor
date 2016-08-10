'use strict'

const async = require('async')
const fs = require('fs')
const config = require('../config')

module.exports = function launchdListDaemonPlists (callback) {
  async.waterfall([
    fs.readdir.bind(fs, config.PLIST_LOCATIONS),
    function filterFiles (files, next) {
      next(null, files.filter(function fileFilter (file) {
        return file.substring(0, config.DAEMON_NAME.length + 1) === `${config.DAEMON_NAME}.`
      }))
    }
  ], callback)
}
