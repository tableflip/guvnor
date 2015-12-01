var posix = require('posix')
var logger = require('winston')

module.exports = function posixFindGroupDetails (user, nameOrId, callback) {
  var group

  try {
    group = posix.getgrnam(nameOrId)
  } catch (e) {
    if (e.message === 'group id does not exist') {
      e.code = 'ENOGROUP'
    }

    logger.error('Could not get group for %s', nameOrId)
    logger.error(e)

    return callback(e)
  }

  callback(null, {
    name: group.name,
    gid: group.gid,
    members: group.members
  })
}
