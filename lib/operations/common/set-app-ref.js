'use strict'

const async = require('async')
const config = require('../../daemon/config')
const resetApp = require('./lib/reset-app')
const runCommand = require('./lib/run-command')
const ensureNotRunning = require('./lib/ensure-not-running')
const findApp = require('./lib/find-app')
const updateDepsIfNecessary = require('./lib/update-deps-if-necessary')

module.exports = function setAppRef (context, name, ref, outputStream, callback) {
  findApp(context, name, function (error, app) {
    if (error) {
      return callback(error)
    }

    const target = app.refs.filter(function (existingRef) {
      return existingRef.name === ref
    }).pop()

    if (!target) {
      error = new Error(`Ref ${ref} is not valid for app ${name}`)
      error.code = 'ENOREF'

      return callback(error)
    }

    async.series({
      ensureNotRunning: ensureNotRunning.bind(null, context, app.name),
      throwAwayAnyChanges: resetApp.bind(null, context, app.path, outputStream),
      restoreBranch: runCommand.bind(null, config.GIT_PATH, ['checkout', target.name], app.path, outputStream, `Checking out ref ${app.ref.name} in ${app.path} failed`),
      updateDepsIfNecessary: updateDepsIfNecessary.bind(null, context, app, outputStream)
    }, function (error, results) {
      if (error) {
        return callback(error)
      }

      findApp(context, name, callback)
    })
  })
}
