'use strict'

const path = require('path')
const ensureVagrantIsRunning = require('./vagrant')
const find = require('./find')
const retry = require('./retry')
const run = require('./run')
const logger = require('winston')
const PROJECT_ROOT = path.resolve(path.join(__dirname, '..', '..', '..'))

const vagrantWrapper = (vagrant, command, options) => {
  options = options || {}

  return run(vagrant, ['ssh', '-c', command.join(' ')], {
    cwd: PROJECT_ROOT,
    ignoreExit: options.ignoreExit,
    hideOutput: options.hideOutput
  })
}

const dockerWrapper = (docker, command, options) => {
  options = options || {}

  // remove 'docker' from start of command
  command.shift()

  return run(docker, command, options)
}

module.exports = () => {
  if (process.platform === 'darwin') {
    logger.debug('Running on OS X, starting Vagrant if necessary')
    logger.debug(`Working directory ${PROJECT_ROOT}`)

    return find('vagrant')
    .catch((error) => {
      throw new Error('Could not find vagrant, is it installed and on the $PATH? - ' + error.message)
    })
    .then((vagrant) => {
      return ensureVagrantIsRunning(vagrant)
      .then(() => vagrantWrapper.bind(null, vagrant))
    })
  } else if (process.platform === 'linux') {
    logger.debug('Running on Linux, using Docker directly')
    return find('docker')
    .catch((error) => {
      throw new Error('Could not find docker, is it installed and on the $PATH? - ' + error.message)
    })
    .then((docker) => {
      return dockerWrapper.bind(null, docker)
    })
  } else {
    throw new Error(`Unsupport test platform, ${process.platform}, please use Linux or OS X`)
  }
}
