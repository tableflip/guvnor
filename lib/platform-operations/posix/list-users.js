var child_process = require('child_process')
var async = require('async')
var posix = require('posix')
var logger = require('winston')
var findUserDetails = require('./find-user-details')

module.exports = function listUsersPosix (callback) {
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
