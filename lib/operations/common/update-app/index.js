var async = require('async')
var config = require('../../../daemon/config')
var path = require('path')
var resetApp = require('../reset-app')
var installAppDependencies = require('../install-app-dependencies')
var runCommand = require('../run-command')
var logger = require('winston')
var ensureNotRunning = require('../ensure-not-running')
var findApp = require('../find-app')

module.exports = function updateApp (user, name, outputStream, callback) {
  findApp(user, name, function (error, app) {
    if (error) {
      return callback(error)
    }

    var repo = path.join(app.path, '.git')
    var updated

    async.series({
      ensureNotRunning: ensureNotRunning.bind(null, user, app.name),
      throwAwayAnyChanges: resetApp.bind(null, user, app.path, outputStream),
      makeRepositoryBare: runCommand.bind(null, config.GIT_PATH, ['config', 'core.bare', 'true'], repo, outputStream, 'Changing repository ' + repo + ' to bare failed'),
      updateFromRemote: runCommand.bind(null, config.GIT_PATH, ['remote', 'update', '--prune'], repo, outputStream, 'Updating remote history for ' + repo + ' failed'),
      makeRepositoryNotBare: runCommand.bind(null, config.GIT_PATH, ['config', 'core.bare', 'false'], repo, outputStream, 'Changing repository ' + repo + ' to non-bare failed'),
      syncAppDir: resetApp.bind(null, user, app.path, outputStream),
      restoreBranch: runCommand.bind(null, config.GIT_PATH, ['checkout', app.ref.name], app.path, outputStream, 'Checking out ref ' + app.ref.name + ' in ' + repo + ' failed'),
      updatedApp: function (next) {
        findApp(user, name, function (error, app) {
          updated = app
          next(error)
        })
      },
      didCommitChange: function (next) {
        logger.debug('Updated app %s %s to %s', name, app.ref.commit, updated.ref.commit)

        if (updated.ref.commit === app.ref.commit) {
          // no update, finish up
          return next()
        }

        // was package.json changed between the two commits?
        var output = ''

        runCommand(config.GIT_PATH, ['diff', '--name-only', app.ref.commit, updated.ref.commit], app.path, {
          write: function (buffer) {
            output += buffer.toString()
          },
          end: function () {}
        }, 'Finding file changes in ' + app.path + ' failed', function (error) {
          if (error) {
            return next(error)
          }

          logger.debug('App %s changed files', name, output)

          if (output.indexOf('package.json') === -1) {
            // nope, finish up
            return next()
          }

          // package.json was changed, update dependencies
          installAppDependencies(app.path, outputStream, next)
        })
      }
    }, function (error, results) {
      callback(error, updated)
    })
  })
}
