'use strict'

const execFile = require('child-process-promise').execFile
const findUserDetails = require('./find-user-details')

module.exports = function listUsersPosix (context) {
  return execFile('cut', ['-d:', '-f1', '/etc/passwd'])
  .then(result => result.stdout)
  .then(stdout => stdout.trim().split('\n').filter(function (user) {
    return user.substring(0, 1) !== '#'
  }).filter(function (user) {
    return user.substring(0, 1) !== '_'
  }))
  .then(users => Promise.all(users.map((user) => findUserDetails(context, user))))
}
