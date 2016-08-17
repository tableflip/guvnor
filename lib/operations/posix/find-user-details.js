'use strict'

const execFile = require('child-process-promise').execFile
const posix = require('posix')
const findGroupDetails = require('./find-group-details')

const findUserDetailsPosix = (context, nameOrId) => {
  if (!isNaN(nameOrId)) {
    nameOrId = parseInt(nameOrId, 10)
  }

  console.info('returning promise')
  return new Promise((resolve, reject) => {
    const user = posix.getpwnam(nameOrId)

    findGroupDetails(context, user.gid)
    .then(group => {
      const output = {
        uid: user.uid,
        gid: user.gid,
        name: user.name,
        home: user.dir,
        group: group.name,
        groups: []
      }

      return execFile('groups', [user.name])
      .then(result => {
        output.groups = result.stdout
          .substring(result.stdout.indexOf(':') + 1)
          .trim()
          .split(' ')

        return output
      })
    })
    .then(resolve)
    .catch(reject)
  })
  .catch((e) => {
    const error = new Error(`Could not get user details for user "${nameOrId}" - ${e.message}`)
    error.code = 'ENOUSER'

    throw error
  })
}

module.exports = findUserDetailsPosix
