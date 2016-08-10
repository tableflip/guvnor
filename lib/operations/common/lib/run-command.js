'use strict'

const child_process = require('child_process')

module.exports = function runCommand (command, args, cwd, outputStream, errorMessage, callback) {
  if (arguments.length === 5) {
    callback = errorMessage
    errorMessage = outputStream
    outputStream = {
      write: function () {},
      end: function () {}
    }
  }

  const child = child_process.spawn(command, args, {
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
