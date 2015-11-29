var config = require('../../daemon/config')
var path = require('path')
var fs = require('fs')

module.exports = function toAppDir (name, callback) {
  var appDir = path.resolve(path.join(config.APP_DIR, name))

  // do not allow access outside the app directory
  if (appDir.substring(0, config.APP_DIR.length) !== config.APP_DIR) {
    var error = new Error('Invalid app dir')
    error.code = 'EINVALIDAPPDIR'

    return callback(error)
  }

  // ensure directory exists
  fs.stat(appDir, function (error, stats) {
    if (error) {
      if (error.code === 'ENOENT') {
        error = new Error('No app directory found')
        error.code = 'ENOAPP'
      }

      return callback(error)
    }

    if (!stats.isDirectory()) {
      error = new Error('App directory was not a directory')
      error.code = 'EINVALIDAPP'
    }

    callback(error, appDir)
  })
}
