var config = require('../../daemon/config')
var path = require('path')

module.exports = function toAppDir (name, callback) {
  var appDir = path.resolve(path.join(config.APP_DIR, name))

  if (appDir.substring(0, config.APP_DIR.length) !== config.APP_DIR) {
    var error = new Error('Invalid app dir')
    error.code = 'EINVALIDAPPDIR'

    return callback(error)
  }

  callback(null, appDir)
}
