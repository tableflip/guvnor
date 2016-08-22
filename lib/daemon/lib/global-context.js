'use strict'

const format = require('good-enough/transforms/format')
const operations = require('../../operations')

const context = {
  user: {
    name: 'root',
    scope: ['admin'],
    uid: process.getuid(),
    gid: process.getgid(),
    home: '/var/root',
    group: 'root',
    groups: ['root']
  },
  log: (tags, message) => {
    console.info(format({
      timestamp: Date.now(),
      pid: process.pid,
      tags: tags,
      message: message
    }).trim())
  }
}

const createGlobalContextPromise = operations.findUserDetails(context, process.getuid())
.then(user => {
  context.user = user

  return context
})

module.exports = () => createGlobalContextPromise
