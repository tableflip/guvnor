var os = require('os')
var logger = require('winston')

module.exports = {}

var platform = os.platform()
var prefix

if (platform === 'darwin') {
  prefix = 'darwin'

  module.exports.findUserDetails = require('./posix/find-user-details')
} else if (platform === 'linux') {
  prefix = 'posix'

  module.exports.findUserDetails = require('./posix/find-user-details')
}

logger.debug('Returning platform operations for %s/%s', platform, prefix)

if (!prefix) {
  throw new Error('Unsupported platform ' + platform)
}

module.exports.listUsers = require('./' + prefix + '/list-users')
