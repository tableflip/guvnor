var child_process = require('child_process')
var async = require('async')
var plist = require('plist')

function value (dict, key) {
  if (Array.isArray(dict[key])) {
    return dict[key][0]
  }

  return dict[key]
}

module.exports = function darwinFindUserDetails (user, nameOrId, callback) {
  // in dscl, everything is a string
  nameOrId = '' + nameOrId

  async.parallel({
    user: async.waterfall.bind(async, [
      child_process.execFile.bind(child_process, 'dscl', ['-plist', '.', 'readall', '/users', 'UniqueID', 'PrimaryGroupID', 'RecordName', 'NFSHomeDirectory']),
      async.wrapSync(plist.parse),
      function filterUsers (users, next) {
        next(null, users.filter(function (user) {
          return user['dsAttrTypeStandard:UniqueID'].concat(user['dsAttrTypeStandard:RecordName']).some(function (userNameOrId) {
            return userNameOrId === nameOrId
          })
        }).pop())
      }
    ]),
    groups: async.waterfall.bind(async, [
      child_process.execFile.bind(child_process, 'dscl', ['-plist', '.', 'readall', '/groups', 'PrimaryGroupID', 'RecordName', 'GroupMembership']),
      async.wrapSync(plist.parse),
      function filterGroups (groups, next) {
        var groupMemberships = {}
        var groupDetails = {}

        groups.filter(function filterHiddenGroups (group) {
          group['dsAttrTypeStandard:RecordName'] = group['dsAttrTypeStandard:RecordName']
          .filter(function (name) {
            return name.substring(0, 1) !== '_'
          })

          return group['dsAttrTypeStandard:RecordName'].length > 0
        }).forEach(function createGroupMemberships (group) {
          var name = value(group, 'dsAttrTypeStandard:RecordName')
          var gid = value(group, 'dsAttrTypeStandard:PrimaryGroupID')

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

        next(null, {
          memberships: groupMemberships,
          details: groupDetails
        })
      }
    ])
  }, function (error, results) {
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
