'use strict'

const child_process = require('child_process')
const async = require('async')
const plist = require('plist')

function value (dict, key) {
  if (Array.isArray(dict[key])) {
    return dict[key][0]
  }

  return dict[key]
}

module.exports = function listUsersDarwin (context, callback) {
  async.parallel({
    user: child_process.execFile.bind(child_process, 'dscl', ['-plist', '.', 'readall', '/users', 'UniqueID', 'PrimaryGroupID', 'RecordName', 'NFSHomeDirectory']),
    groups: child_process.execFile.bind(child_process, 'dscl', ['-plist', '.', 'readall', '/groups', 'PrimaryGroupID', 'RecordName', 'GroupMembership'])
  }, function (error, results) {
    if (error) {
      return callback(error)
    }

    const groupMemberships = {}
    const groupDetails = {}

    plist.parse(results.groups[0]).filter(function (group) {
      return value(group, 'dsAttrTypeStandard:RecordName').substring(0, 1) !== '_'
    }).map(function (group) {
      const name = value(group, 'dsAttrTypeStandard:RecordName')
      const gid = value(group, 'dsAttrTypeStandard:PrimaryGroupID')

      if (group['dsAttrTypeStandard:GroupMembership']) {
        group['dsAttrTypeStandard:GroupMembership'].forEach(function (user) {
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

    const userDetails = plist.parse(results.user[0]).filter(function (user) {
      return value(user, 'dsAttrTypeStandard:RecordName').substring(0, 1) !== '_'
    }).map(function (user) {
      const group = groupDetails[value(user, 'dsAttrTypeStandard:PrimaryGroupID')].name
      const groups = groupMemberships[value(user, 'dsAttrTypeStandard:RecordName')] || []

      if (groups.indexOf(group) === -1) {
        groups.push(group)
      }

      return {
        uid: Number(value(user, 'dsAttrTypeStandard:UniqueID')),
        gid: Number(value(user, 'dsAttrTypeStandard:PrimaryGroupID')),
        name: value(user, 'dsAttrTypeStandard:RecordName'),
        home: value(user, 'dsAttrTypeStandard:NFSHomeDirectory'),
        group: group,
        groups: groups
      }
    })

    callback(null, userDetails)
  })
}
