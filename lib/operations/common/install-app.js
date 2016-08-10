'use strict'

const async = require('async')
const config = require('../../daemon/config')
const shortId = require('shortid')
const path = require('path')
const resetApp = require('./lib/reset-app')
const installAppDependencies = require('./lib/install-app-dependencies')
const runCommand = require('./lib/run-command')
const fs = require('fs')
const findApp = require('./lib/find-app')
const Wrench = require('wrench')
const WARN = require('good-enough').WARN
const DEBUG = require('good-enough').DEBUG
const CONTEXT = 'operations:common:install-app'

module.exports = function installApp (context, url, options, outputStream, callback) {
  const id = shortId.generate()
  let appPath = path.join(config.APP_DIR, id)
  const clonePath = path.join(appPath, '.git')

  async.series([
    runCommand.bind(null, config.GIT_PATH, ['clone', '--mirror', url, clonePath], config.APP_DIR, outputStream, `Cloning ${url} failed`),
    runCommand.bind(null, config.GIT_PATH, ['config', 'core.bare', 'false'], clonePath, outputStream, `Changing repository ${appPath} to non-bare failed`),
    resetApp.bind(null, context, appPath, outputStream),
    function findName (next) {
      if (options.name) {
        return next(null, options.name)
      }

      try {
        const pkg = require(path.join(appPath, 'package.json'))
        options.name = pkg.name
        next()
      } catch (error) {
        error.code = 'ENOPACKAGE.JSON'
        next(error)
      }
    },
    function find (next) {
      findApp(context, options.name, function (error, app) {
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
    async.asyncify(Wrench.chownSyncRecursive.bind(Wrench, appPath, context.user.uid, context.user.gid)),
    function renameDir (next) {
      const newPath = path.join(config.APP_DIR, options.name)

      context.log([DEBUG, CONTEXT], `Renaming ${appPath} to ${newPath}`)

      fs.rename(appPath, newPath, function (error) {
        if (!error) {
          appPath = newPath
        }

        next(error)
      })
    },
    function find (next) {
      findApp(context, options.name, next)
    }
  ], function (error, results) {
    if (error) {
      context.log([WARN, CONTEXT], error)

      try {
        context.log([DEBUG, CONTEXT], 'App install failed, removing ' + appPath)
        Wrench.rmdirSyncRecursive(appPath)
      } catch (e) {
        context.log([WARN, CONTEXT], 'Failed to clean up app installation')
        context.log([WARN, CONTEXT], e)
      }
    }

    callback(error, results[8])
  })
}
