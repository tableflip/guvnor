'use strict'

const spawn = require('mz/child_process').spawn

function runCommand (command, args, cwd, outputStream, errorMessage) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: cwd
    })
    child.stdout.on('data', function (data) {
      outputStream.write(data)
    })
    child.stderr.on('data', function (data) {
      outputStream.write(data)
    })
    child.on('close', function (code) {
      code === 0 ? resolve() : reject(new Error(errorMessage))
    })
  })
}

module.exports = runCommand
