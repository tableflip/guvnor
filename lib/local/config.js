var coercer = require('coercer')
var commonConfig = require('../common/config')
var config = JSON.parse(JSON.stringify(commonConfig))

config.DAEMON_USER = process.env.DAEMON_USER || 'root'
config.DAEMON_GROUP = process.env.DAEMON_GROUP || 'root'

module.exports = Object.freeze(coercer(config))
