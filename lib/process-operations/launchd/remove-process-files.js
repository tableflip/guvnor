var logger = require('winston')
var fs = require('fs')
var path = require('path')
var config = require('./config')
var processOperations = require('../')

module.exports = function launchdRemoveProcessFiles (user, name, callback) {
  var plist = path.join(config.PLIST_LOCATIONS, 'guvnor.' + name + '.plist')
  logger.debug('removing', plist)

  fs.unlink(plist, callback)
}
