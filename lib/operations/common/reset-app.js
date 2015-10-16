var async = require('async')
var runCommand = require('./run-command')
var config = require('../../daemon/config')

module.exports = function resetApp (appDir, outputStream, callback) {
  async.series([
    runCommand.bind(null, config.GIT_PATH, ['reset', '--hard', 'HEAD'], appDir, outputStream, 'Resetting ' + appDir + ' failed'),
    runCommand.bind(null, config.GIT_PATH, ['clean', '-d', '-f'], appDir, outputStream, 'Cleaning repository ' + appDir + ' failed'),
  ], callback)
}
