'use strict'

const execSync = require('child_process').execSync
const path = require('path')
const fs = require('fs-promise')
const os = require('os')
const coercer = require('coercer')
const commonConfig = require('../common/config')
const config = JSON.parse(JSON.stringify(commonConfig))

const userName = execSync('whoami').toString().trim()

config.USER_CERT = process.env.USER_CERT || fs.readFileSync(path.join(os.homedir(), '.config', 'guvnor', `${userName}.pub`))
config.USER_KEY = process.env.USER_KEY || fs.readFileSync(path.join(os.homedir(), '.config', 'guvnor', `${userName}.key`))
config.CA = process.env.CA || fs.readFileSync(path.join(config.CONFIG_DIR, 'ca.crt'))

module.exports = Object.freeze(coercer(config))
