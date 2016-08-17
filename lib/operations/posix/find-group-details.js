'use strict'

const posix = require('posix')

const findGroup = (context, nameOrId) => {
  return new Promise((resolve, reject) => {
    try {
      resolve(posix.getgrnam(nameOrId))
    } catch (e) {
      reject(e)
    }
  })
}

const posixFindGroupDetails = (context, nameOrId, callback) => {
  if (!isNaN(nameOrId)) {
    nameOrId = parseInt(nameOrId, 10)
  }

  findGroup(context, nameOrId)
  .then(group => {
    return {
      name: group.name,
      gid: group.gid,
      members: group.members
    }
  })
  .catch((e) => {
    const error = new Error(`Could not get group for "${nameOrId}" - ${e.message}`)
    error.code = 'ENOGROUP'

    throw error
  })
}

module.exports = posixFindGroupDetails
