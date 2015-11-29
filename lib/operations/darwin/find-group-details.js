var child_process = require('child_process')
var async = require('async')
var plist = require('plist')

function value (dict, key) {
  if (Array.isArray(dict[key])) {
    return dict[key][0]
  }

  return dict[key]
}

module.exports = function darwinFindGroupDetails (user, nameOrId, callback) {
  // in dscl, everything is a string
  nameOrId = '' + nameOrId

  async.waterfall([
    child_process.execFile.bind(child_process, 'dscl', ['-plist', '.', 'readall', '/groups', 'PrimaryGroupID', 'RecordName', 'GroupMembership']),
    async.wrapSync(plist.parse),
    function filterGroups (groups, next) {
      next(null, groups.filter(function findGroup (group) {
        return value(group, 'dsAttrTypeStandard:PrimaryGroupID') === nameOrId
      }).map(function (group) {
        return {
          name: value(group, 'dsAttrTypeStandard:RecordName'),
          gid: parseInt(value(group, 'dsAttrTypeStandard:PrimaryGroupID'), 10),
          members: group['dsAttrTypeStandard:GroupMembership']
        }
      }).pop())
    }
  ], callback)
}
