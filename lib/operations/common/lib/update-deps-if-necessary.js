var config = require('../../../daemon/config')
var installAppDependencies = require('./install-app-dependencies')
var runCommand = require('./run-command')
var findApp = require('./find-app')
var DEBUG = require('good-enough').DEBUG
var WARN = require('good-enough').WARN
var CONTEXT = 'operations:common:lib:update-deps-if-necessary'

module.exports = function updateDepsIfNecessary (context, app, outputStream, callback) {
  findApp(context, app.name, function (error, updated) {
    if (error) {
      return callback(error)
    }

    context.log([DEBUG, CONTEXT], 'Looking for package.json changes between ' + app.ref.commit + ' and ' + updated.ref.commit)

    if (updated.ref.commit === app.ref.commit) {
      // no update, finish up
      return callback()
    }

    // was package.json changed between the two commits?
    var output = ''

    runCommand(config.GIT_PATH, ['diff', '--name-only', app.ref.commit, updated.ref.commit], app.path, {
      write: function (buffer) {
        output += buffer.toString()
      },
      end: function () {}
    }, 'Finding file changes in ' + app.path + ' failed', function (error) {
      if (error) {
        return callback(error)
      }

      context.log([DEBUG, CONTEXT], 'App ' + app.name + ' changed files ' + output)

      if (output.indexOf('package.json') === -1) {
        // nope, finish up
        return callback()
      }

      // package.json was changed, update dependencies
      installAppDependencies(app.path, outputStream, callback)
    })
  })
}
