var child_process = require('child_process')
var async = require('async')
var plist = require('plist')

function value (dict, key) {
  if (Array.isArray(dict[key])) {
    return dict[key][0]
  }

  return dict[key]
}

module.exports = function listUsersDarwin (callback) {
  async.parallel({
    user: child_process.execFile.bind(child_process, 'dscl', ['-plist', '.', 'readall', '/users', 'UniqueID', 'PrimaryGroupID', 'RecordName', 'NFSHomeDirectory']),
    groups: child_process.execFile.bind(child_process, 'dscl', ['-plist', '.', 'readall', '/groups', 'PrimaryGroupID', 'RecordName', 'GroupMembership'])
  }, function (error, results) {
    var groupMemberships = {}
    var groupDetails = {}

    plist.parse(results.groups[0]).filter(function (group) {
      return value(group, 'dsAttrTypeStandard:RecordName').substring(0, 1) !== '_'
    }).map(function (group) {
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

    var userDetails = plist.parse(results.user[0]).filter(function (user) {
      return value(user, 'dsAttrTypeStandard:RecordName').substring(0, 1) !== '_'
    }).map(function (user) {
      return {
        uid: Number(value(user, 'dsAttrTypeStandard:UniqueID')),
        gid: Number(value(user, 'dsAttrTypeStandard:PrimaryGroupID')),
        name: value(user, 'dsAttrTypeStandard:RecordName'),
        home: value(user, 'dsAttrTypeStandard:NFSHomeDirectory'),
        group: groupDetails[value(user, 'dsAttrTypeStandard:PrimaryGroupID')].name,
        groups: groupMemberships[value(user, 'dsAttrTypeStandard:RecordName')] || []
      }
    })

    callback(null, userDetails)
  })
}
