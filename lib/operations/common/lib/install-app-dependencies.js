'use strict'

const async = require('async')
const rimraf = require('rimraf')
const path = require('path')
const runCommand = require('./run-command')
const config = require('../../../daemon/config')

module.exports = function installAppDependencies (appDir, outputStream, callback) {
  async.series([
    rimraf.bind(rimraf, path.join(appDir, 'node_modules')),
    runCommand.bind(null, config.NPM_PATH, ['install', '--production', '--spin=false', '--loglevel=http', '--color=false'], appDir, outputStream, 'Installing app dependencies failed')
  ], callback)
}
