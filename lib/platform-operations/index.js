var os = require('os')
var logger = require('winston')

module.exports = {}

var platform = os.platform()
var prefix

if (platform === 'darwin') {
  prefix = 'darwin'
} else if (platform === 'linux') {
  prefix = 'posix'
}

logger.debug('Returning platform operations for %s/%s', platform, prefix)

if (!prefix) {
  throw new Error('Unsupported platform ' + platform)
}

module.exports.findUserDetails = require('./common/find-user-details')
module.exports.listUsers = require('./' + prefix + '/list-users')
