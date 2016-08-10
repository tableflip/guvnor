'use strict'

const config = require('../../daemon/config')
const fs = require('fs')
const async = require('async')
const findApp = require('./lib/find-app')

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
  ], (error, result) => {
    callback(error, error ? undefined : result)
  })
}
