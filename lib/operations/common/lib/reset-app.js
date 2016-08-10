'use strict'

const async = require('async')
const runCommand = require('./run-command')
const config = require('../../../daemon/config')

module.exports = (context, appDir, outputStream, callback) => {
  async.series([
    runCommand.bind(null, config.GIT_PATH, ['reset', '--hard', 'HEAD'], appDir, outputStream, `Resetting ${appDir} failed`),
    runCommand.bind(null, config.GIT_PATH, ['clean', '-d', '-f'], appDir, outputStream, `Cleaning repository ${appDir} failed`)
  ], callback)
}
