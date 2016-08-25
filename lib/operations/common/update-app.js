'use strict'

const config = require('../../daemon/config')
const path = require('path')
const resetApp = require('./lib/reset-app')
const runCommand = require('./lib/run-command')
const ensureNotRunning = require('./lib/ensure-not-running')
const operations = require('../')
const updateDepsIfNecessary = require('./lib/update-deps-if-necessary')

const updateApp = (context, name, outputStream, callback) => {
  return operations.findApp(context, name)
  .then(app => {
    const repo = path.join(app.path, '.git')

    return ensureNotRunning(context, app.name)
    .then(() => resetApp(context, app.path, outputStream))
    .then(() => runCommand(context, config.GIT_PATH, ['config', 'core.bare', 'true'], repo, outputStream, `Changing repository ${repo} to bare failed`))
    .then(() => runCommand(context, config.GIT_PATH, ['remote', 'update', '--prune'], repo, outputStream, `Updating remote history for ${repo} failed`))
    .then(() => runCommand(context, config.GIT_PATH, ['config', 'core.bare', 'false'], repo, outputStream, `Changing repository ${repo} to non-bare failed`))
    .then(() => resetApp(context, app.path, outputStream))
    .then(() => runCommand(context, config.GIT_PATH, ['checkout', app.ref.name], app.path, outputStream, `Checking out ref ${app.ref.name} in ${app.path} failed`))
    .then(() => updateDepsIfNecessary(context, app, outputStream))
    .then(() => findApp(context, name))
  })
}

module.exports = updateApp
