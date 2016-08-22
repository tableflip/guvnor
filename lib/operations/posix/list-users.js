'use strict'

const execFile = require('mz/child_process').execFile
const findUserDetails = require('./find-user-details')

module.exports = function listUsersPosix (context) {
  return execFile('cut', ['-d:', '-f1', '/etc/passwd'])
  .then(stdout => stdout.trim().split('\n')
    .filter((user) => user.substring(0, 1) !== '#')
    .filter(user => user.substring(0, 1) !== '_'))
  .then(users => Promise.all(users.map((user) => findUserDetails(context, user))))
}
