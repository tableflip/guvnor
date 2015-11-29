var async = require('async')
var config = require('../../../daemon/config')
var resetApp = require('../reset-app')
var runCommand = require('../run-command')
var ensureNotRunning = require('../ensure-not-running')
var findApp = require('../find-app')
var updateDepsIfNecessary = require('../update-app/update-deps-if-necessary')

module.exports = function setAppRef (user, name, ref, outputStream, callback) {
  findApp(user, name, function (error, app) {
    if (error) {
      return callback(error)
    }

    var target = app.refs.filter(function (existingRef) {
      return existingRef.name === ref
    }).pop()

    if (!target) {
      error = new Error('Ref ' + ref + ' is not valid for app ' + name)
      error.code = 'ENOREF'

      return callback(error)
    }

    async.series({
      ensureNotRunning: ensureNotRunning.bind(null, user, app.name),
      throwAwayAnyChanges: resetApp.bind(null, user, app.path, outputStream),
      restoreBranch: runCommand.bind(null, config.GIT_PATH, ['checkout', target.name], app.path, outputStream, 'Checking out ref ' + app.ref.name + ' in ' + app.path + ' failed'),
      updateDepsIfNecessary: updateDepsIfNecessary.bind(null, user, app, outputStream)
    }, function (error, results) {
      if (error) {
        return callback(error)
      }

      findApp(user, name, callback)
    })
  })
}
