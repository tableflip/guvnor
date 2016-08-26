'use strict'

const Boom = require('boom')
const config = require('../../daemon/config')
const resetApp = require('./lib/reset-app')
const runCommand = require('./lib/run-command')
const ensureNotRunning = require('./lib/ensure-not-running')
const operations = require('../')
const updateDepsIfNecessary = require('./lib/update-deps-if-necessary')
const explode = require('../../common/explode')
const INFO = require('good-enough').INFO
const CONTEXT = 'operations:common:set-app-ref'

const setAppRef = (context, name, ref, outputStream) => {
  return operations.findApp(context, name)
  .then(app => {
    const target = app.refs.find((existingRef) => existingRef.name === ref)

    if (!target) {
      context.log([INFO, CONTEXT], `Could not find ref '${ref}' for app ${name} - available refs: ${app.refs.map(ref => `'${ref.name}'`).join(', ')}`)

      const error = Boom.badRequest(`Ref ${ref} is not valid for app ${name}`)
      error.code = explode.ENOREF

      throw error
    }

    context.log([INFO, CONTEXT], `Setting app ${name} ref to ${ref}`)

    return ensureNotRunning(context, app.name)
    .catch(error => {
      if (error.code === explode.ENOPROC) {
        return
      }

      if (error.code === explode.ERUNNING) {
        error = Boom.conflict(`App ${name} is already running!`)
        error.code = explode.ERUNNING
      }

      throw error
    })
    .then(() => resetApp(context, app.path, outputStream))
    .then(() => runCommand(context, config.GIT_PATH, ['checkout', target.name], app.path, outputStream, `Checking out ref ${app.ref.name} in ${app.path} failed`))
    .then(() => updateDepsIfNecessary(context, app, outputStream))
    .then(() => operations.findApp(context, name))
  })
}

module.exports = setAppRef
