'use strict'

const config = require('../../../daemon/config')
const installAppDependencies = require('./install-app-dependencies')
const runCommand = require('./run-command')
const findApp = require('./find-app')
const DEBUG = require('good-enough').DEBUG
const CONTEXT = 'operations:common:lib:update-deps-if-necessary'

module.exports = (context, app, outputStream, callback) => {
  findApp(context, app.name, (error, updated) => {
    if (error) {
      return callback(error)
    }

    context.log([DEBUG, CONTEXT], `Looking for package.json changes between ${app.ref.commit} and ${updated.ref.commit}`)

    if (updated.ref.commit === app.ref.commit) {
      // no update, finish up
      return callback()
    }

    // was package.json changed between the two commits?
    let output = ''

    runCommand(config.GIT_PATH, ['diff', '--name-only', app.ref.commit, updated.ref.commit], app.path, {
      write: (buffer) => {
        output += buffer.toString()
      },
      end: () => {}
    }, `Finding file changes in ${app.path} failed`, (error) => {
      if (error) {
        return callback(error)
      }

      context.log([DEBUG, CONTEXT], `App ${app.name} changed files ${output}`)

      if (output.indexOf('package.json') === -1) {
        // nope, finish up
        return callback()
      }

      // package.json was changed, update dependencies
      installAppDependencies(app.path, outputStream, callback)
    })
  })
}
