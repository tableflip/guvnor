'use strict'

const config = require('../../../daemon/config')
const installAppDependencies = require('./install-app-dependencies')
const runCommand = require('./run-command')
const findApp = require('./find-app')
const DEBUG = require('good-enough').DEBUG
const CONTEXT = 'operations:common:lib:update-deps-if-necessary'

const updateDepsIfNecessary = (context, app, outputStream) => {
  return findApp(context, app.name)
  .then(updated => {
    context.log([DEBUG, CONTEXT], `Looking for package.json changes between ${app.ref.commit} and ${updated.ref.commit}`)

    if (updated.ref.commit === app.ref.commit) {
      // no update, finish up
      return
    }

    // was package.json changed between the two commits?
    let output = ''

    return runCommand(context, config.GIT_PATH, ['diff', '--name-only', app.ref.commit, updated.ref.commit], app.path, {
      write: (buffer) => {
        output += buffer.toString()
      },
      end: () => {}
    }, `Finding file changes in ${app.path} failed`)
    .then(() => {
      context.log([DEBUG, CONTEXT], `App ${app.name} changed files ${output}`)

      if (output.indexOf('package.json') === -1) {
        // nope, finish up
        return
      }

      // package.json was changed, update dependencies
      return installAppDependencies(context, app.path, outputStream)
    })
  })
}

module.exports = updateDepsIfNecessary
