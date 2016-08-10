'use strict'

const async = require('async')
const operations = require('../operations')
const fs = require('fs')
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

  async.parallel({
    key: fs.readFile.bind(fs, keyFile, 'utf8'),
    cert: fs.readFile.bind(fs, certFile, 'utf8'),
    ca: fs.readFile.bind(fs, caFile, 'utf8')
  }, (error, results) => {
    if (error && error.code === 'ENOENT') {
      logger.error(`No user certificate was found, please run 'sudo guv useradd ${user.name}'`)
      process.exit(1)
    }

    callback(error, results)
  })
}

const loadKeyBundle = (user, callback) => {
  const keyBundle = loadKeyBundleFromEnv()

  if (keyBundle) {
    return callback(null, keyBundle)
  }

  return loadKeyBundleFromFile(user, callback)
}

module.exports = (callback) => {
  async.waterfall([
    operations.findUserDetails.bind(null, null, process.getuid()),
    (user, next) => {
      loadKeyBundle(user, (error, keyBundle) => {
        user.keyBundle = keyBundle
        next(error, user)
      })
    }
  ], callback)
}
