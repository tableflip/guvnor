var async = require('async')
var config = require('../../daemon/config')
var path = require('path')
var resetApp = require('./lib/reset-app')
var runCommand = require('./lib/run-command')
var ensureNotRunning = require('./lib/ensure-not-running')
var findApp = require('./lib/find-app')
var updateDepsIfNecessary = require('./lib/update-deps-if-necessary')

module.exports = function updateApp (user, name, outputStream, callback) {
  findApp(user, name, function (error, app) {
    if (error) {
      return callback(error)
    }

    var repo = path.join(app.path, '.git')

    async.series({
      ensureNotRunning: ensureNotRunning.bind(null, user, app.name),
      throwAwayAnyChanges: resetApp.bind(null, user, app.path, outputStream),
      makeRepositoryBare: runCommand.bind(null, config.GIT_PATH, ['config', 'core.bare', 'true'], repo, outputStream, 'Changing repository ' + repo + ' to bare failed'),
      updateFromRemote: runCommand.bind(null, config.GIT_PATH, ['remote', 'update', '--prune'], repo, outputStream, 'Updating remote history for ' + repo + ' failed'),
      makeRepositoryNotBare: runCommand.bind(null, config.GIT_PATH, ['config', 'core.bare', 'false'], repo, outputStream, 'Changing repository ' + repo + ' to non-bare failed'),
      syncAppDir: resetApp.bind(null, user, app.path, outputStream),
      restoreBranch: runCommand.bind(null, config.GIT_PATH, ['checkout', app.ref.name], app.path, outputStream, 'Checking out ref ' + app.ref.name + ' in ' + app.path + ' failed'),
      updateDepsIfNecessary: updateDepsIfNecessary.bind(null, user, app, outputStream)
    }, function (error, results) {
      if (error) {
        return callback(error)
      }

      findApp(user, name, callback)
    })
  })
}
