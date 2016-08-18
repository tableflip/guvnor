'use strict'

const execFile = require('child-process-promise').execFile
const plist = require('plist')
const plistValue = require('./plist-value')

const listUsersDarwin = (context, callback) => {
  return Promise.all([
    execFile('dscl', ['-plist', '.', 'readall', '/users', 'UniqueID', 'PrimaryGroupID', 'RecordName', 'NFSHomeDirectory'])
    .then(result => plist.parse(result.stdout))
    .then(users => users.filter(user => plistValue(user, 'dsAttrTypeStandard:RecordName').substring(0, 1) !== '_')),
    execFile('dscl', ['-plist', '.', 'readall', '/groups', 'PrimaryGroupID', 'RecordName', 'GroupMembership'])
    .then(result => plist.parse(result.stdout))
    .then(groups => groups.filter(group => plistValue(group, 'dsAttrTypeStandard:RecordName').substring(0, 1) !== '_'))
  ])
  .then(results => {
    const users = results[0]
    const groups = results[1]

    const groupMemberships = {}
    const groupDetails = {}

    groups.forEach(group => {
      const name = plistValue(group, 'dsAttrTypeStandard:RecordName')
      const gid = plistValue(group, 'dsAttrTypeStandard:PrimaryGroupID')

      if (group['dsAttrTypeStandard:GroupMembership']) {
        group['dsAttrTypeStandard:GroupMembership'].forEach(user => {
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

    return users.map(user => {
      const group = groupDetails[plistValue(user, 'dsAttrTypeStandard:PrimaryGroupID')].name
      const groups = groupMemberships[plistValue(user, 'dsAttrTypeStandard:RecordName')] || []

      if (groups.indexOf(group) === -1) {
        groups.push(group)
      }

      return {
        uid: Number(plistValue(user, 'dsAttrTypeStandard:UniqueID')),
        gid: Number(plistValue(user, 'dsAttrTypeStandard:PrimaryGroupID')),
        name: plistValue(user, 'dsAttrTypeStandard:RecordName'),
        home: plistValue(user, 'dsAttrTypeStandard:NFSHomeDirectory'),
        group: group,
        groups: groups
      }
    })
  })
}

module.exports = listUsersDarwin
