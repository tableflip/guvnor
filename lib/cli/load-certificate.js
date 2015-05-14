var fs = require('fs')
var path = require('path')
var logger = require('winston')

module.exports = function loadCertificate (user, callback) {
  var bundleFile = path.join(user.home, '.config', 'guvnor', user.name + '.keys')
  logger.debug('Looking for key bundle at %s', bundleFile)

  fs.readFile(bundleFile, {
    encoding: 'utf8'
  }, function (error, bundle) {
    if (error && error.code === 'ENOENT') {
      logger.error('No user certificate was found, please run `sudo guv useradd ' + user.name + '`')
      process.exit(1)
    }

    logger.debug('Loaded key bundle at %s', bundleFile)
    callback(error, error ? null : JSON.parse(bundle))
  })
}
