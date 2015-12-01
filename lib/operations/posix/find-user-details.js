var child_process = require('child_process')
var posix = require('posix')
var logger = require('winston')

module.exports = function findUserDetailsPosix (user, nameOrId, callback) {
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

  child_process.execFile('groups', [user.name], function (error, stdout) {
    if (stdout) {
      output.groups = stdout
        .substring(stdout.indexOf(':') + 1)
        .trim()
        .split(' ')
    }

    callback(error, output)
  })
}
