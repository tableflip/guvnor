'use strict'

const runCommand = require('./run-command')
const config = require('../../../daemon/config')

const resetApp = (context, appDir, outputStream) => {
  return runCommand(context, config.GIT_PATH, ['reset', '--hard', 'HEAD'], appDir, outputStream, `Resetting ${appDir} failed`)
  .then(() => runCommand(context, config.GIT_PATH, ['clean', '-d', '-f'], appDir, outputStream, `Cleaning repository ${appDir} failed`))
}

module.exports = resetApp
