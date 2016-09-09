'use strict'

const execFile = require('mz/child_process').execFile
const plist = require('plist')
const plistValue = require('./plist-value')
const DEBUG = require('good-enough').DEBUG
const CONTEXT = 'operations:darwin:find-user-details'

module.exports = (context, nameOrId) => {
  context.log([DEBUG, CONTEXT], `Finding details for user ${nameOrId}`)

  // in dscl, everything is a string
  nameOrId = `${nameOrId}`

  return Promise.all([
    execFile('dscl', ['-plist', '.', 'readall', '/users', 'UniqueID', 'PrimaryGroupID', 'RecordName', 'NFSHomeDirectory'])
    .then(result => {
      return plist.parse(result[0])
    })
    .then(users => users.filter(user => user['dsAttrTypeStandard:UniqueID'].concat(user['dsAttrTypeStandard:RecordName']).some(userNameOrId => userNameOrId === nameOrId)))
    .then(users => users.pop()),
    execFile('dscl', ['-plist', '.', 'readall', '/groups', 'PrimaryGroupID', 'RecordName', 'GroupMembership'])
    .then(result => {
      return plist.parse(result[0])
    })
    .then(groups => {
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
        const name = plistValue(group, 'dsAttrTypeStandard:RecordName')
        const gid = plistValue(group, 'dsAttrTypeStandard:PrimaryGroupID')

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

      return {
        memberships: groupMemberships,
        details: groupDetails
      }
    })
  ])
  .then(results => {
    const user = results[0]
    const groups = results[1]
    const primaryGid = plistValue(user, 'dsAttrTypeStandard:PrimaryGroupID')

    return {
      uid: Number(plistValue(user, 'dsAttrTypeStandard:UniqueID')),
      gid: Number(plistValue(user, 'dsAttrTypeStandard:PrimaryGroupID')),
      name: plistValue(user, 'dsAttrTypeStandard:RecordName'),
      home: plistValue(user, 'dsAttrTypeStandard:NFSHomeDirectory'),
      group: groups.details[primaryGid] ? groups.details[primaryGid].name : primaryGid,
      groups: groups.memberships[plistValue(user, 'dsAttrTypeStandard:RecordName')] || []
    }
  })
  .then(user => {
    context.log([DEBUG, CONTEXT], `${nameOrId} is ${user.name}`)

    return user
  })
}
