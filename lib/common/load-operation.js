var os = require('os')
var logger = require('winston')
var path = require('path')

module.exports = function loadOperation () {
  var platform = os.platform()
  var args = Array.prototype.slice.call(arguments)
  var cwd = args.shift()
  var callback = args[args.length - 1]
  var prefix

  if (platform === 'darwin') {
    prefix = 'launchd'
  }

  if (!prefix) {
    return callback(new Error('Unsupported platform ' + platform))
  }

  var operationPath = path.resolve(path.join(cwd, prefix))

  logger.debug('Loading %s', operationPath)

  var operation

  try {
    operation = require(operationPath)
  } catch(error) {
    return callback(error)
  }

  operation.apply(null, args)
}
