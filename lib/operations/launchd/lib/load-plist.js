var async = require('async')
var plist = require('plist')
var fs = require('fs')
var config = require('../config')
var path = require('path')

var PLIST_SUFFIX = '.plist'
var GUVNOR_PREFIX = 'guvnor.'

module.exports = function launchdLoadPlist (processName, callback) {
  if (processName.substring(processName.length - PLIST_SUFFIX.length) !== PLIST_SUFFIX) {
    processName += PLIST_SUFFIX
  }

  if (processName.substring(0, GUVNOR_PREFIX.length) !== GUVNOR_PREFIX) {
    processName = GUVNOR_PREFIX + processName
  }

  var file = path.join(config.PLIST_LOCATIONS, processName)

  async.waterfall([
    fs.readFile.bind(fs, file, 'utf8'),
    async.asyncify(plist.parse)
  ], callback)
}
