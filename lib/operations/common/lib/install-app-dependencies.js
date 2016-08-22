'use strict'

const fs = require('fs-promise')
const path = require('path')
const runCommand = require('./run-command')
const config = require('../../../daemon/config')

const installAppDependencies = (appDir, outputStream) => {
  fs.remove(path.join(appDir, 'node_modules'))
  .then(() => runCommand(config.NPM_PATH, ['install', '--production', '--spin=false', '--loglevel=http', '--color=false'], appDir, outputStream, 'Installing app dependencies failed'))
}

module.exports = installAppDependencies
