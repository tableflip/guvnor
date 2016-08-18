'use strict'

const execFile = require('child-process-promise').execFile
const plist = require('plist')
const plistValue = require('./plist-value')

const darwinFindGroupDetails = (context, nameOrId, callback) => {
  // in dscl, everything is a string
  nameOrId = `${nameOrId}`

  return execFile('dscl', ['-plist', '.', 'readall', '/groups', 'PrimaryGroupID', 'RecordName', 'GroupMembership'])
  .then(result => plist.parse(result.stdout))
  .then(groups => groups.filter(group => plistValue(group, 'dsAttrTypeStandard:PrimaryGroupID') === nameOrId))
  .then(groups => (group) => {
    return {
      name: plistValue(group, 'dsAttrTypeStandard:RecordName'),
      gid: parseInt(plistValue(group, 'dsAttrTypeStandard:PrimaryGroupID'), 10),
      members: group['dsAttrTypeStandard:GroupMembership']
    }
  })
  .then(groups => groups.pop())
}

module.exports = darwinFindGroupDetails
