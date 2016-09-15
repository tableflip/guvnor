'use strict'

const execSync = require('child_process').execSync
const path = require('path')
const fs = require('fs-promise')
const os = require('os')
const coercer = require('coercer')
const commonConfig = require('../common/config')
const config = JSON.parse(JSON.stringify(commonConfig))

const userName = execSync('whoami').toString().trim()

config.USER_CERT = process.env.USER_CERT
config.USER_KEY = process.env.USER_KEY
config.CA = process.env.CA

if (!config.USER_CERT) {
  try {
    config.USER_CERT = fs.readFileSync(path.join(os.homedir(), '.config', config.DAEMON_NAME, `${userName}.pub`))
  } catch (error) {}
}

if (!config.USER_KEY) {
  try {
    config.USER_KEY = fs.readFileSync(path.join(os.homedir(), '.config', config.DAEMON_NAME, `${userName}.key`))
  } catch (error) {}
}

if (!config.CA) {
  try {
    config.CA = fs.readFileSync(path.join(config.CONFIG_DIR, 'ca.crt'))
  } catch (error) {}
}

module.exports = Object.freeze(coercer(config))
