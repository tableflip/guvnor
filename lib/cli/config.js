'use strict'

const coercer = require('coercer')
const commonConfig = require('../common/config')
const config = JSON.parse(JSON.stringify(commonConfig))

config.USER_CERT = process.env.USER_CERT
config.USER_KEY = process.env.USER_KEY
config.CA = process.env.CA

module.exports = Object.freeze(coercer(config))
