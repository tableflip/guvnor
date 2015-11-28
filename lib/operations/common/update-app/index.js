var async = require('async')
var config = require('../../../daemon/config')
var resetApp = require('../reset-app')
var installAppDependencies = require('../install-app-dependencies')
var runCommand = require('../run-command')
var logger = require('winston')
var ensureNotRunning = require('../../common/ensure-not-running')
var findApp = require('../find-app')

function doUpdate (user, outputStream, app, next) {
  async.series([
    runCommand.bind(null, config.GIT_PATH, ['config', 'core.bare', 'true'], app.repo, outputStream, 'Changing repository ' + app.repo + ' to bare failed'),
    runCommand.bind(null, config.GIT_PATH, ['remote', 'update', '--prune'], app.repo, outputStream, 'Updating remote history for ' + app.repo + ' failed'),
    runCommand.bind(null, config.GIT_PATH, ['config', 'core.bare', 'false'], app.repo, outputStream, 'Changing repository ' + app.repo + ' to non-bare failed'),
    resetApp.bind(null, outputStream),
    runCommand.bind(null, config.GIT_PATH, ['checkout', app.ref], app.path, outputStream, 'Checking out ref ' + app.ref + ' in ' + app.repo + ' failed')
  ], function (error) {
    next(error, app)
  })
}

function updateDependencies (user, outputStream, oldApp, next) {
  logger.debug('Looking at what changed with', oldApp.name)

  findApp(user, oldApp.name, function (error, app) {
    if (error) {
      return next(error)
    }

    logger.debug('App %s original commit %s new commit %s', app.name, oldApp.commit, app.commit)

    if (oldApp.commit === app.commit) {
      // no update
      return next(error, app)
    }

    var output = ''

    runCommand(config.GIT_PATH, ['diff', '--name-only', oldApp.commit, app.commit], app.path, {
      write: function (buffer) {
        output += buffer.toString()
      },
      end: function () {}
    }, 'Finding file changes in ' + app.path + ' failed', function (error) {
      if (error) {
        return next(error)
      }

      logger.debug('App %s changed files', app.name, output)

      if (output.indexOf('package.json') === -1) {
        return next(null, app)
      }

      // update dependencies
      installAppDependencies(app.path, outputStream, next)
    })
  })
}

module.exports = function updateApp (user, name, outputStream, callback) {
  findApp(user, name, function (error, app) {
    if (error) {
      return callback(error)
    }

    async.waterfall([
      ensureNotRunning.bind(null, user, app),
      resetApp.bind(null, user, outputStream, app),
      doUpdate.bind(null, user, outputStream, app),
      updateDependencies.bind(null, user, outputStream, app)
    ], callback)
  })
}
