'use strict'

const coercer = require('coercer')
const path = require('path')
const os = require('os')
const commonConfig = require('../common/config')
const config = JSON.parse(JSON.stringify(commonConfig))

config.APP_DIR = process.env.APP_DIR || path.join('/usr', 'local', config.DAEMON_NAME)
config.RPC_TIMEOUT = process.env.RPC_TIMEOUT || 5000
config.CA_CERTIFICATE = process.env.CA_CERTIFICATE
config.CA_KEY = process.env.CA_KEY
config.CA_PASSPHRASE = process.env.CA_PASSPHRASE
config.HTTP_PORT = process.env.HTTP_PORT || 8000
config.HTTPS_PORT = process.env.HTTPS_PORT || 8001
config.HTTPS_HOST = process.env.HTTPS_HOST || os.hostname()
config.GIT_PATH = process.env.GIT_PATH || 'git'
config.NPM_PATH = process.env.NPM_PATH || 'npm'

module.exports = Object.freeze(coercer(config))
