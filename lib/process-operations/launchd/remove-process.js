var logger = require('winston')

var fs = require('fs')
var path = require('path')
var config = require('./config')
var processOperations = require('../')

module.exports = function launchdRemove (user, name, callback) {
  processOperations.stopProcess(user, name, function (error) {
    if (error) {
      return callback(error)
    }

    var plist = path.join(config.PLIST_LOCATIONS, 'guvnor.' + name + '.plist')
    logger.debug('removing', plist)

    fs.unlink(plist, callback)
  })
}
