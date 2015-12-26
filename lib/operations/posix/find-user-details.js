var child_process = require('child_process')
var posix = require('posix')
var ERROR = require('good-enough').ERROR
var CONTEXT = 'operations:posix:find-group-details'

module.exports = function findUserDetailsPosix (context, nameOrId, callback) {
  var group
  var user

  try {
    user = posix.getpwnam(nameOrId)
  } catch (e) {
    if (e.message === 'user id does not exist') {
      e.code = 'ENOUSER'
    }

    context.log([ERROR, CONTEXT], 'Could not get user details for user "' + nameOrId + '"')
    context.log([ERROR, CONTEXT], e)

    return callback(e)
  }

  try {
    group = posix.getgrnam(user.gid)
  } catch (e) {
    if (e.message === 'group id does not exist') {
      e.code = 'ENOGROUP'
    }

    context.log([ERROR, CONTEXT], 'Could not get user group for user "' + nameOrId + '", gid "' + user.gid + '"')
    context.log([ERROR, CONTEXT], e)

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
