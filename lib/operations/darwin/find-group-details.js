'use strict'

const execFile = require('mz/child_process').execFile
const plist = require('plist')
const plistValue = require('./plist-value')

const darwinFindGroupDetails = (context, nameOrId) => {
  // in dscl, everything is a string
  nameOrId = `${nameOrId}`

  return execFile('dscl', ['-plist', '.', 'readall', '/groups', 'PrimaryGroupID', 'RecordName', 'GroupMembership'])
  .then(([stdout]) => plist.parse(stdout))
  .then(groups => groups.filter(group => plistValue(group, 'dsAttrTypeStandard:PrimaryGroupID') === nameOrId))
  .then(groups => groups.pop())
  .then(group => {
    return {
      name: plistValue(group, 'dsAttrTypeStandard:RecordName'),
      gid: parseInt(plistValue(group, 'dsAttrTypeStandard:PrimaryGroupID'), 10),
      members: group['dsAttrTypeStandard:GroupMembership']
    }
  })
}

module.exports = darwinFindGroupDetails
