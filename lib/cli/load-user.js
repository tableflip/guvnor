'use strict'

const operations = require('../operations')
const fs = require('fs-promise')
const path = require('path')
const logger = require('winston')
const config = require('./config')

const loadKeyBundleFromEnv = () => {
  if (config.USER_CERT && config.USER_KEY && config.CA) {
    logger.debug('Returning key bundle from environment')

    return {
      cert: config.USER_CERT,
      key: config.USER_KEY,
      ca: config.CA
    }
  }
}

const loadKeyBundleFromFile = (user, callback) => {
  const keyFile = path.join(user.home, '.config', config.DAEMON_NAME, `${user.name}.key`)
  const certFile = path.join(user.home, '.config', config.DAEMON_NAME, `${user.name}.pub`)
  const caFile = path.join(config.CONFIG_DIR, 'ca.crt')

  logger.debug(`Looking for key at ${keyFile}`)
  logger.debug(`Looking for cert at ${certFile}`)
  logger.debug(`Looking for ca at ${caFile}`)

  return Promise.all([
    fs.readFile(keyFile, 'utf8'),
    fs.readFile(certFile, 'utf8'),
    fs.readFile(caFile, 'utf8')
  ])
  .then(results => {
    return {
      key: results[0],
      cert: results[1],
      ca: results[2]
    }
  })
  .catch(error => {
    if (error && error.code === 'ENOENT') {
      error = new Error(`No user certificate was found, please run 'sudo guv useradd ${user.name}'`)
      error.code = 'ENOCERT'
    }

    throw error
  })
}

const loadKeyBundle = (user, callback) => {
  const keyBundle = loadKeyBundleFromEnv()

  if (keyBundle) {
    return callback(null, keyBundle)
  }

  return loadKeyBundleFromFile(user, callback)
}

module.exports = () => {
  return operations.findUserDetails({
    id: 'cli',
    user: {
      name: 'cli',
      scope: ['user'],
      uid: 0,
      gid: 0,
      home: '/var/root',
      group: 'root',
      groups: ['root']
    },
    log: (tags, message) => {
      logger.debug(message)
    }
  }, process.getuid())
  .then(user => loadKeyBundle(user)
    .then(keyBundle => {
      user.keyBundle = keyBundle

      return user
    })
  )
}
