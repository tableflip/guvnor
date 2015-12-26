var fs = require('fs')
var path = require('path')
var config = require('./config')
var DEBUG = require('good-enough').DEBUG
var CONTEXT = 'operations:launchd:remove-process-files'
var async = require('async')

module.exports = function launchdRemoveProcessFiles (context, name, callback) {
  async.parallel([
    removePlist.bind(null, context, name),
    removeLogRotation.bind(null, context, name)
  ], function launchdRemovedProcessFiles (error) {
    callback(error)
  })
}

function removePlist (context, name, callback) {
  var plist = path.join(config.PLIST_LOCATIONS, 'guvnor.' + name + '.plist')

  context.log([DEBUG, CONTEXT], 'Removing ' + plist)

  fs.unlink(plist, callback)
}

function removeLogRotation (context, name, callback) {
  var rotateFile = path.join(config.NEWSYSLOGD_PATH, 'guvnor.' + name + '.conf')

  context.log([DEBUG, CONTEXT], 'Removing ' + rotateFile)

  fs.unlink(rotateFile, callback)
}
