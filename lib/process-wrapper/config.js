'use strict'

const coercer = require('coercer')
const commonConfig = require('../common/config')
const config = JSON.parse(JSON.stringify(commonConfig))

module.exports = Object.freeze(coercer(config))
