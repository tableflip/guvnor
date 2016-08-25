'use strict'

const config = require('../../daemon/config')
const resetApp = require('./lib/reset-app')
const runCommand = require('./lib/run-command')
const ensureNotRunning = require('./lib/ensure-not-running')
const operations = require('../')
const updateDepsIfNecessary = require('./lib/update-deps-if-necessary')

const setAppRef = (context, name, ref, outputStream) => {
  return operations.findApp(context, name)
  .then(app => {
    const target = app.refs.filter((existingRef) => existingRef.name === ref).pop()

    if (!target) {
      const error = new Error(`Ref ${ref} is not valid for app ${name}`)
      error.code = 'ENOREF'

      throw error
    }

    return ensureNotRunning(context, app.name)
    .then(() => resetApp(context, app.path, outputStream))
    .then(() => runCommand(context, config.GIT_PATH, ['checkout', target.name], app.path, outputStream, `Checking out ref ${app.ref.name} in ${app.path} failed`))
    .then(() => updateDepsIfNecessary(context, app, outputStream))
    .then(() => operations.findApp(context, name))
  })
}

module.exports = setAppRef
