var config = require('../../../daemon/config')
var installAppDependencies = require('../install-app-dependencies')
var runCommand = require('../run-command')
var logger = require('winston')
var findApp = require('../find-app')

module.exports = function updateDepsIfNecessary (user, app, outputStream, callback) {
  findApp(user, app.name, function (error, updated) {
    if (error) {
      return callback(error)
    }

    logger.debug('Looking for package.json changes between %s and %s', app.ref.commit, updated.ref.commit)

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

      logger.debug('App %s changed files', app.name, output)

      if (output.indexOf('package.json') === -1) {
        // nope, finish up
        return callback()
      }

      // package.json was changed, update dependencies
      installAppDependencies(app.path, outputStream, callback)
    })
  })
}
