'use strict'

const rimraf = require('rimraf')
const path = require('path')
const config = require('../../daemon/config')
const findApp = require('./lib/find-app')
const async = require('async')

module.exports = function removeApp (context, name, callback) {
  async.series([
    findApp.bind(null, context, name),
    function (next) {
      const doomed = path.resolve(path.join(config.APP_DIR, name))

      if (doomed.substring(0, config.APP_DIR.length) !== config.APP_DIR || doomed === config.APP_DIR) {
        return next(new Error('Invalid path'))
      }

      rimraf(doomed, next)
    }
  ], function (error) {
    return callback(error)
  })
}
