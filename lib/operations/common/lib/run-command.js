'use strict'

const spawn = require('mz/child_process').spawn
const INFO = require('good-enough').INFO
const CONTEXT = 'operations:common:lib:run-command'

function runCommand (context, command, args, cwd, outputStream, errorMessage) {
  return new Promise((resolve, reject) => {
    context.log([INFO, CONTEXT], `${command} ${args.join(' ')}`)

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
