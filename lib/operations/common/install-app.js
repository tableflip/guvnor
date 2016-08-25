'use strict'

const config = require('../../daemon/config')
const shortId = require('shortid')
const path = require('path')
const resetApp = require('./lib/reset-app')
const installAppDependencies = require('./lib/install-app-dependencies')
const runCommand = require('./lib/run-command')
const fs = require('fs-promise')
const operations = require('../')
const WARN = require('good-enough').WARN
const DEBUG = require('good-enough').DEBUG
const CONTEXT = 'operations:common:install-app'

const findName = (context, appPath, options) => {
  if (options.name) {
    return options.name
  }

  try {
    const pkg = require(path.join(appPath, 'package.json'))
    options.name = pkg.name
  } catch (error) {
    error.code = 'ENOPACKAGE.JSON'
    throw error
  }
}

const ensureAppDoesNotExist = (context, options) => {
  return operations.findApp(context, options.name)
  .catch(() => {})
  .then(app => {
    if (app) {
      const error = new Error('An app with that name already exists')
      error.code = 'EAPPEXIST'

      throw error
    }
  })
}

const renameDir = (context, options, appPath) => {
  const newPath = path.join(config.APP_DIR, options.name)

  context.log([DEBUG, CONTEXT], `Renaming ${appPath} to ${newPath}`)

  return fs.rename(appPath, newPath)
  .then(() => newPath)
}

const installApp = (context, url, options, outputStream) => {
  const id = shortId.generate()
  let appPath = path.join(config.APP_DIR, id)
  const clonePath = path.join(appPath, '.git')

  return runCommand(context, config.GIT_PATH, ['clone', '--mirror', url, clonePath], config.APP_DIR, outputStream, `Cloning ${url} failed`)
  .then(() => runCommand(context, config.GIT_PATH, ['config', 'core.bare', 'false'], clonePath, outputStream, `Changing repository ${appPath} to non-bare failed`))
  .then(() => resetApp(context, appPath, outputStream))
  .then(() => findName(context, appPath, options))
  .then(() => ensureAppDoesNotExist(context, options))
  .then(() => renameDir(context, options, appPath).then(newPath => {
    appPath = newPath
  }))
  .then(() => installAppDependencies(context, appPath, outputStream))
  .then(() => fs.chown(appPath, context.user.uid, context.user.gid))
  .then(() => fs.walk(appPath))
  .then(items => Promise.all(items.map(item => fs.chown(item.path, context.user.uid, context.user.gid))))
  .then(() => operations.findApp(context, options.name))
  .catch(error => {
    context.log([WARN, CONTEXT], error.stack)

    try {
      context.log([DEBUG, CONTEXT], 'App install failed, removing ' + appPath)
      return fs.remove(appPath)
      .then(() => {
        throw error
      })
    } catch (e) {
      context.log([WARN, CONTEXT], 'Failed to clean up app installation')
      context.log([WARN, CONTEXT], e.stack)

      throw e
    }
  })
}

module.exports = installApp
