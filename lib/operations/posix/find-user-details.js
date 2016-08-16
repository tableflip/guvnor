'use strict'

const async = require('async')
const child_process = require('child_process')
const posix = require('posix')
const passwd = require('etc-passwd')
const findGroupDetails = require('./find-group-details')
const ERROR = require('good-enough').ERROR
const DEBUG = require('good-enough').DEBUG
const CONTEXT = 'operations:posix:find-user-details'

const findUserPosix = (context, nameOrId, callback) => {
  let user

  try {
    user = posix.getpwnam(nameOrId)
  } catch (e) {
    context.log([DEBUG, CONTEXT], `Loading user "${nameOrId}" via posix failed ${e.message}`)
  }

  callback(user)
}

const findUserEtcPasswd = (context, nameOrId, callback) => {
  const query = {}

  if (isNaN(nameOrId)) {
    query.username = nameOrId
  } else {
    query.uid = nameOrId
  }

  passwd.getUser(query, (error, user) => {
    if (error) {
      context.log([DEBUG, CONTEXT], `Loading user "${nameOrId}" with query ${JSON.stringify(query)} via /etc/passwd failed ${error.message}`)
    }

    if (user) {
      // /etc/passwd and posix fields differ slightly
      user.name = user.username
      user.dir = user.home
    }

    callback(user)
  })
}

const findUser = (context, nameOrId, callback) => {
  findUserPosix(context, nameOrId, (user) => {
    if (user) {
      return callback(user)
    }

    context.log([DEBUG, CONTEXT], 'Falling back to /etc/passwd')

    findUserEtcPasswd(context, nameOrId, callback)
  })
}

const findUserDetailsPosix = (context, nameOrId, callback) => {
  if (!isNaN(nameOrId)) {
    nameOrId = parseInt(nameOrId, 10)
  }

  findUser(context, nameOrId, (user) => {
    if (!user) {
      const error = new Error(`Could not get user details for user "${nameOrId}"`)
      error.code = 'ENOUSER'

      return callback(error)
    }

    findGroupDetails(context, user.gid, (error, group) => {
      if (error) {
        return callback(error)
      }

      const output = {
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
    })
  })
}

module.exports = findUserDetailsPosix
