'use strict'

const async = require('async')
const config = require('../../daemon/config')
const path = require('path')
const resetApp = require('./lib/reset-app')
const runCommand = require('./lib/run-command')
const ensureNotRunning = require('./lib/ensure-not-running')
const findApp = require('./lib/find-app')
const updateDepsIfNecessary = require('./lib/update-deps-if-necessary')

module.exports = function updateApp (context, name, outputStream, callback) {
  findApp(context, name, function (error, app) {
    if (error) {
      return callback(error)
    }

    const repo = path.join(app.path, '.git')

    async.series({
      ensureNotRunning: ensureNotRunning.bind(null, context, app.name),
      throwAwayAnyChanges: resetApp.bind(null, context, app.path, outputStream),
      makeRepositoryBare: runCommand.bind(null, config.GIT_PATH, ['config', 'core.bare', 'true'], repo, outputStream, `Changing repository ${repo} to bare failed`),
      updateFromRemote: runCommand.bind(null, config.GIT_PATH, ['remote', 'update', '--prune'], repo, outputStream, `Updating remote history for ${repo} failed`),
      makeRepositoryNotBare: runCommand.bind(null, config.GIT_PATH, ['config', 'core.bare', 'false'], repo, outputStream, `Changing repository ${repo} to non-bare failed`),
      syncAppDir: resetApp.bind(null, context, app.path, outputStream),
      restoreBranch: runCommand.bind(null, config.GIT_PATH, ['checkout', app.ref.name], app.path, outputStream, `Checking out ref ${app.ref.name} in ${app.path} failed`),
      updateDepsIfNecessary: updateDepsIfNecessary.bind(null, context, app, outputStream)
    }, function (error, results) {
      if (error) {
        return callback(error)
      }

      findApp(context, name, callback)
    })
  })
}
