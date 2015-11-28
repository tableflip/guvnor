var async = require('async')
var config = require('../../daemon/config')
var path = require('path')
var resetApp = require('./reset-app')
var installAppDependencies = require('./install-app-dependencies')
var runCommand = require('./run-command')
var logger = require('winston')
var ensureNotRunning = require('../common/ensure-not-running')
var operations = require('../')

module.exports = function updateApp (user, name, outputStream, callback) {
  var appPath = path.join(config.APP_DIR, name)
  var repoPath = path.join(appPath, '.git')
  var originalRef

  async.series([
    ensureNotRunning.bind(null, user, name),
    resetApp.bind(null, appPath, outputStream),
    function recordAppRef (next) {
      operations.findAppRef(user, name, function foundAppRef (error, ref) {
        originalRef = ref

        next(error, ref)
      })
    },
    runCommand.bind(null, config.GIT_PATH, ['config', 'core.bare', 'true'], repoPath, outputStream, 'Changing repository ' + repoPath + ' to bare failed'),
    runCommand.bind(null, config.GIT_PATH, ['remote', 'update', '--prune'], repoPath, outputStream, 'Updating remote history for ' + repoPath + ' failed'),
    runCommand.bind(null, config.GIT_PATH, ['config', 'core.bare', 'false'], repoPath, outputStream, 'Changing repository ' + repoPath + ' to non-bare failed'),
    resetApp.bind(null, appPath, outputStream),
    runCommand.bind(null, config.GIT_PATH, ['checkout', originalRef.name], repoPath, outputStream, 'Checking out ref ' + originalRef.name + ' in ' + repoPath + ' failed'),
    function findNewAppRef (next) {
      operations.findAppRef(user, name, function foundNewAppRef (error, newRef) {
        if (error) {
          return next(error)
        }

        logger.debug('App %s original commit %s new commit %s', name, originalRef.commit, newRef.commit)

        if (originalRef.commit === newRef.commit) {
          return next()
        }

        var output = ''

        runCommand(config.GIT_PATH, ['diff', '--name-only', originalRef.commit, newRef.commit], appPath, {
          write: function (buffer) {
            output += buffer.toString()
          },
          end: function () {}
        }, 'Finding file changes in ' + appPath + ' failed', function (error) {
          if (error) {
            return next(error)
          }

          logger.debug('App %s changed files', name, output)

          if (output.indexOf('package.json') === -1) {
            return next()
          }

          // update dependencies
          installAppDependencies(appPath, outputStream, next)
        })
      })
    }
  ], callback)
}
