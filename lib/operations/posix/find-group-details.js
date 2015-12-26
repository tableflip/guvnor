var posix = require('posix')
var ERROR = require('good-enough').ERROR
var CONTEXT = 'operations:posix:find-group-details'

module.exports = function posixFindGroupDetails (context, nameOrId, callback) {
  var group

  try {
    group = posix.getgrnam(nameOrId)
  } catch (e) {
    if (e.message === 'group id does not exist') {
      e.code = 'ENOGROUP'
    }

    context.log([ERROR, CONTEXT], 'Could not get group for ' + nameOrId)
    context.log([ERROR, CONTEXT], e)

    return callback(e)
  }

  callback(null, {
    name: group.name,
    gid: group.gid,
    members: group.members
  })
}
