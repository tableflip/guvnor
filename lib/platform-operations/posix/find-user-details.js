var child_process = require('child_process')
var async = require('async')
var posix = require('posix')
var logger = require('winston')
var findUserFingerprint = require('./find-user-fingerprint')

module.exports = function findUserDetails (nameOrId, callback) {
  var user
  var group

  try {
    user = posix.getpwnam(nameOrId)
  } catch (e) {
    if (e.message === 'user id does not exist') {
      e.code = 'ENOUSER'
    }

    logger.error('Could not get user details for user "%s"', nameOrId)
    logger.error(e)

    return callback(e)
  }

  try {
    group = posix.getgrnam(user.gid)
  } catch (e) {
    if (e.message === 'group id does not exist') {
      e.code = 'ENOGROUP'
    }

    logger.error('Could not get user group for user "%s", gid %d %s', nameOrId, user.gid, typeof user.gid)
    logger.error(e)

    return callback(e)
  }

  var output = {
    uid: user.uid,
    gid: user.gid,
    name: user.name,
    home: user.dir,
    group: group.name,
    groups: []
  }

  async.parallel({
    groups: function (next) {
      child_process.execFile('groups', [user.name], function (error, stdout) {
        next(error, stdout)
      })
    },
    fingerprint: function (next) {
      findUserFingerprint(output, next)
    }
  }, function (error, results) {
    if (results) {
      results.groups = results.groups || ''
      results.groups = results.groups.substring(results.groups.indexOf(':') + 1)

      output.groups = results.groups.trim().split(' ')
      output.fingerprint = results ? results.fingerprint : ''
    }

    callback(error, output)
  })
}
