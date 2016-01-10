var coercer = require('coercer')
var commonConfig = require('../common/config')
var config = JSON.parse(JSON.stringify(commonConfig))

module.exports = Object.freeze(coercer(config))
