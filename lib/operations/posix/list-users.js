'use strict'

const child_process = require('child_process')
const async = require('async')
const findUserDetails = require('./find-user-details')

module.exports = function listUsersPosix (context, callback) {
  child_process.execFile('cut', ['-d:', '-f1', '/etc/passwd'], function (error, stdout) {
    if (error) {
      return callback(error)
    }

    async.map(stdout.trim().split('\n').filter(function (user) {
      return user.substring(0, 1) !== '#'
    }).filter(function (user) {
      return user.substring(0, 1) !== '_'
    }), findUserDetails, callback)
  })
}
