var config = require('../../daemon/config')
var fs = require('fs')
var async = require('async')
var findApp = require('./lib/find-app')

module.exports = function listApps (context, callback) {
  async.waterfall([
    fs.readdir.bind(fs, config.APP_DIR),
    function (dirs, done) {
      async.map(dirs, function (dir, next) {
        findApp(context, dir, function (error, app) {
          if (error) {

          }

          next(null, app)
        })
      }, done)
    },
    function (apps, next) {
      next(null, apps.filter(function (app) {
        return app
      }))
    }
  ], callback)
}
