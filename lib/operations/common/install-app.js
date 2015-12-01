var async = require('async')
var config = require('../../daemon/config')
var shortId = require('shortid')
var path = require('path')
var resetApp = require('./lib/reset-app')
var installAppDependencies = require('./lib/install-app-dependencies')
var runCommand = require('./lib/run-command')
var fs = require('fs')
var logger = require('winston')
var findApp = require('./lib/find-app')
var Wrench = require('wrench')

module.exports = function installApp (user, url, options, outputStream, callback) {
  var id = shortId.generate()
  var appPath = path.join(config.APP_DIR, id)
  var clonePath = path.join(appPath, '.git')

  async.series([
    runCommand.bind(null, config.GIT_PATH, ['clone', '--mirror', url, clonePath], config.APP_DIR, outputStream, 'Cloning ' + url + ' failed'),
    runCommand.bind(null, config.GIT_PATH, ['config', 'core.bare', 'false'], clonePath, outputStream, 'Changing repository ' + appPath + ' to non-bare failed'),
    resetApp.bind(null, user, appPath, outputStream),
    function findName (next) {
      if (options.name) {
        return next(null, options.name)
      }

      try {
        var pkg = require(path.join(appPath, 'package.json'))
        options.name = pkg.name
        next()
      } catch (error) {
        error.code = 'ENOPACKAGE.JSON'
        next(error)
      }
    },
    function find (next) {
      findApp(user, options.name, function (error, app) {
        if (app) {
          error = new Error('An app with that name already exists')
          error.code = 'EAPPEXIST'
        } else {
          error = null
        }

        next(error)
      })
    },
    installAppDependencies.bind(null, appPath, outputStream),
    async.asyncify(Wrench.chownSyncRecursive.bind(Wrench, appPath, user.uid, user.gid)),
    function renameDir (next) {
      var newPath = path.join(config.APP_DIR, options.name)

      logger.debug('Renaming', appPath, 'to', newPath)

      fs.rename(appPath, newPath, function (error) {
        if (!error) {
          appPath = newPath
        }

        next(error)
      })
    },
    function find (next) {
      findApp(user, options.name, next)
    }
  ], function (error, results) {
    if (error) {
      logger.warn(error)

      try {
        logger.warn(error)
        logger.debug('App install failed, removing', appPath)
        Wrench.rmdirSyncRecursive(appPath)
      } catch (e) {
        logger.warn('Failed to clean up app installation')
        logger.warn(e)
      }
    }

    callback(error, results[8])
  })
}
