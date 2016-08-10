'use strict'

const findApp = require('./lib/find-app')

module.exports = function listAppRefs (context, name, callback) {
  findApp(context, name, function (error, app) {
    callback(error, error ? null : app.refs)
  })
}
