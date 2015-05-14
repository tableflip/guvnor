var rimraf = require('rimraf')
var path = require('path')
var config = require('../../daemon/config')
var findApp = require('./find-app')
var async = require('async')

module.exports = function removeApp (user, name, callback) {
  async.series([
    findApp.bind(null, user, name),
    function (next) {
      var doomed = path.resolve(path.join(config.APP_DIR, name))

      if (doomed.substring(0, config.APP_DIR.length) !== config.APP_DIR || doomed === config.APP_DIR) {
        return next(new Error('Invalid path'))
      }

      rimraf(doomed, next)
    }
  ], function (error) {
    return callback(error)
  })
}
