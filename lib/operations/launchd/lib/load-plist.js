var async = require('async')
var plist = require('plist')
var fs = require('fs')
var config = require('../config')
var path = require('path')

var PLIST_SUFFIX = '.plist'
var DAEMON_PREFIX = config.DAEMON_NAME + '.'

module.exports = function launchdLoadPlist (processName, callback) {
  if (processName.substring(processName.length - PLIST_SUFFIX.length) !== PLIST_SUFFIX) {
    processName += PLIST_SUFFIX
  }

  if (processName.substring(0, DAEMON_PREFIX.length) !== DAEMON_PREFIX) {
    processName = DAEMON_PREFIX + processName
  }

  var file = path.join(config.PLIST_LOCATIONS, processName)

  async.waterfall([
    fs.readFile.bind(fs, file, 'utf8'),
    async.asyncify(plist.parse)
  ], callback)
}
