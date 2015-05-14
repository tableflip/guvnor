var async = require('async')
var findApp = require('./find-app')
var runCommand = require('./run-command')
var config = require('../../daemon/config')
var toAppDir = require('./to-app-dir')
var findAppRefs = require('./list-app-refs')
var path = require('path')

module.exports = function findAppRef (user, name, callback) {
  async.waterfall([
    toAppDir.bind(null, name),
    function withAppDir (appDir, next) {
      var output = ''

      async.parallel([
        runCommand.bind(null, config.GIT_PATH, ['rev-parse', 'HEAD'], appDir, {
          write: function (buffer) {
            output += buffer.toString()
          },
          end: function () {}
        }, 'Finding the current HEAD in ' + appDir + ' failed'),
        findAppRefs.bind(null, user, name)
      ], function (error, result) {
        if (error) {
          return next(error)
        }

        var commit = output.trim()
        var currentRef

        result[1].some(function (ref) {
          if (ref.commit === commit) {
            currentRef = ref

            return true
          }
        })

        next(error, currentRef)
      })
    }
  ], callback)
}
