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

module.exports = function darwinFindGroupDetails (context, nameOrId, callback) {
  // in dscl, everything is a string
  nameOrId = `${nameOrId}`

  async.waterfall([
    child_process.execFile.bind(child_process, 'dscl', ['-plist', '.', 'readall', '/groups', 'PrimaryGroupID', 'RecordName', 'GroupMembership']),
    async.wrapSync(plist.parse),
    (groups, next) => {
      next(null, groups.filter(function findGroup (group) {
        return value(group, 'dsAttrTypeStandard:PrimaryGroupID') === nameOrId
      }).map((group) => {
        return {
          name: value(group, 'dsAttrTypeStandard:RecordName'),
          gid: parseInt(value(group, 'dsAttrTypeStandard:PrimaryGroupID'), 10),
          members: group['dsAttrTypeStandard:GroupMembership']
        }
      }).pop())
    }
  ], callback)
}
