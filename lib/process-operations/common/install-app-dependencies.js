var async = require('async')
var rimraf = require('rimraf')
var path = require('path')
var runCommand = require('./run-command')
var config = require('../../daemon/config')

module.exports = function installAppDependencies (appDir, outputStream, callback) {
  async.series([
    rimraf.bind(rimraf, path.join(appDir, 'node_modules')),
    runCommand.bind(null, config.NPM_PATH, ['install', '--production', '--spin=false', '--loglevel=http', '--color=false'], appDir, outputStream, 'Installing app dependencies failed')
  ], callback)
}
