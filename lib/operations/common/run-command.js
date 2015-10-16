var child_process = require('child_process')
var logger = require('winston')

module.exports = function runCommand (command, args, cwd, outputStream, errorMessage, callback) {
  if (arguments.length === 5) {
    callback = errorMessage
    errorMessage = outputStream
    outputStream = {
      write: function () {},
      end: function () {}
    }
  }

  logger.debug('Running %s %j in directory %s', command, args, cwd)
  var child = child_process.spawn(command, args, {
    cwd: cwd
  })
  child.stdout.on('data', function (data) {
    outputStream.write(data)
  })
  child.stderr.on('data', function (data) {
    outputStream.write(data)
  })
  child.on('close', function (code) {
    callback(code === 0 ? null : new Error(errorMessage))
  })
}
