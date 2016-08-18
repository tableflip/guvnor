'use strict'

const child_process = require('child-process-promise').execFile
const async = require('async')
const plist = require('plist')

const value = (dict, key) => {
  if (Array.isArray(dict[key])) {
    return dict[key][0]
  }

  return dict[key]
}

module.exports = (context, nameOrId, callback) => {
  // in dscl, everything is a string
  nameOrId = `${nameOrId}`

  async.parallel({
    user: async.waterfall.bind(async, [
      child_process.execFile.bind(child_process, 'dscl', ['-plist', '.', 'readall', '/users', 'UniqueID', 'PrimaryGroupID', 'RecordName', 'NFSHomeDirectory']),
      async.wrapSync(plist.parse),
      (users, next) => {
        next(null, users.filter(function (user) {
          return user['dsAttrTypeStandard:UniqueID'].concat(user['dsAttrTypeStandard:RecordName']).some((userNameOrId) => {
            return userNameOrId === nameOrId
          })
        }).pop())
      }
    ]),
    groups: async.waterfall.bind(async, [
      child_process.execFile.bind(child_process, 'dscl', ['-plist', '.', 'readall', '/groups', 'PrimaryGroupID', 'RecordName', 'GroupMembership']),
      async.wrapSync(plist.parse),
      (groups, next) => {
        const groupMemberships = {}
        const groupDetails = {}

        // filter hidden groups
        groups.filter((group) => {
          group['dsAttrTypeStandard:RecordName'] = group['dsAttrTypeStandard:RecordName']
          .filter((name) => {
            return name.substring(0, 1) !== '_'
          })

          return group['dsAttrTypeStandard:RecordName'].length > 0
        }).forEach((group) => {
          // create group memberships
          const name = value(group, 'dsAttrTypeStandard:RecordName')
          const gid = value(group, 'dsAttrTypeStandard:PrimaryGroupID')

          if (group['dsAttrTypeStandard:GroupMembership']) {
            group['dsAttrTypeStandard:GroupMembership'].forEach((user) => {
              if (!groupMemberships[user]) {
                groupMemberships[user] = []
              }

              groupMemberships[user].push(name)
            })
          }

          groupDetails[gid] = {
            name: name
          }
        })

        next(null, {
          memberships: groupMemberships,
          details: groupDetails
        })
      }
    ])
  }, (error, results) => {
    if (error) {
      return callback(error)
    }

    callback(null, {
      uid: Number(value(results.user, 'dsAttrTypeStandard:UniqueID')),
      gid: Number(value(results.user, 'dsAttrTypeStandard:PrimaryGroupID')),
      name: value(results.user, 'dsAttrTypeStandard:RecordName'),
      home: value(results.user, 'dsAttrTypeStandard:NFSHomeDirectory'),
      group: results.groups.details[value(results.user, 'dsAttrTypeStandard:PrimaryGroupID')].name,
      groups: results.groups.memberships[value(results.user, 'dsAttrTypeStandard:RecordName')] || []
    })
  })
}
