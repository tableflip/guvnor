'use strict'

const posix = require('posix')
const passwd = require('etc-passwd')
const ERROR = require('good-enough').ERROR
const DEBUG = require('good-enough').DEBUG
const CONTEXT = 'operations:posix:find-group-details'

const findGroupPosix = (context, nameOrId, callback) => {
  let group

  try {
    group = posix.getgrnam(nameOrId)
  } catch (error) {
    context.log([DEBUG, CONTEXT], `Loading group "${nameOrId}" via posix failed`)
    context.log([DEBUG, CONTEXT], error)
  }

  callback(group)
}

const findGroupEtcPasswd = (context, nameOrId, callback) => {
  const query = {}

  if (isNaN(nameOrId)) {
    query.groupname = nameOrId
  } else {
    query.gid = nameOrId
  }

  passwd.getGroup(query, function(error, group) {
    if (error) {
      context.log([DEBUG, CONTEXT], `Loading group "${nameOrId}" with query ${JSON.stringify(query)} via /etc/group failed`)
      context.log([DEBUG, CONTEXT], error)
    }

    if (group) {
      // /etc/passwd and posix fields differ slightly
      group.name = group.groupname
      group.members = group.users
    }

    callback(group)
  })
}

const findGroup = (context, nameOrId, callback) => {
  findGroupPosix(context, nameOrId, (user) => {
    if (user) {
      return callback(user)
    }

    context.log([DEBUG, CONTEXT], `Falling back to /etc/passwd`)

    findGroupEtcPasswd(context, nameOrId, callback)
  })
}

const posixFindGroupDetails = (context, nameOrId, callback) => {
  if (!isNaN(nameOrId)) {
    nameOrId = parseInt(nameOrId, 10)
  }

  findGroup(context, nameOrId, (group) => {
    if (!group) {
      const error = new Error(`Could not get group for "${nameOrId}"`)
      error.code = 'ENOGROUP'

      return callback(error)
    }

    callback(null, {
      name: group.name,
      gid: group.gid,
      members: group.members
    })
  })
}

module.exports = posixFindGroupDetails
