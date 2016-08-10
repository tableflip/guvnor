'use strict'

const coercer = require('coercer')
const commonConfig = require('../common/config')
const config = JSON.parse(JSON.stringify(commonConfig))

config.DAEMON_USER = process.env.DAEMON_USER || 'root'
config.DAEMON_GROUP = process.env.DAEMON_GROUP || 'root'

module.exports = Object.freeze(coercer(config))
