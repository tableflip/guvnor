'use strict'

const os = require('os')
const logger = require('winston')
const path = require('path')

module.exports = function loadOperation () {
  const platform = os.platform()
  const args = Array.prototype.slice.call(arguments)
  const cwd = args.shift()
  const callback = args[args.length - 1]
  let prefix

  if (platform === 'darwin') {
    prefix = 'launchd'
  }

  if (!prefix) {
    return callback(new Error(`Unsupported platform ${platform}`))
  }

  const operationPath = path.resolve(path.join(cwd, prefix))

  logger.debug(`Loading ${operationPath}`)

  let operation

  try {
    operation = require(operationPath)
  } catch (error) {
    return callback(error)
  }

  operation.apply(null, args)
}
