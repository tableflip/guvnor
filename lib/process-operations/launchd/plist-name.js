var path = require('path')
var config = require('./config')

module.exports = function (processName) {
  return path.join(config.PLIST_LOCATIONS, processName + '.plist')
}
