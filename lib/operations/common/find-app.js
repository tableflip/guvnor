var config = require('../../daemon/config')
var path = require('path')
var logger = require('winston')

module.exports = function findApp (user, name, callback) {
  var app = {
    name: name
  }

  var pkg

  try {
    var pkgPath = path.resolve(path.join(config.APP_DIR, name, 'package.json'))
    delete require.cache[pkgPath]
    logger.debug('Requiring', pkgPath)
    pkg = require(pkgPath)
  } catch (error) {
    logger.debug('Could not require', pkgPath, error.message)
    error.code = 'ENOAPP'

    return callback(error)
  }

  app.version = pkg.version

  callback(null, app)
}
