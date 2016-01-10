var coercer = require('coercer')
var commonConfig = require('../config')
var config = JSON.parse(JSON.stringify(commonConfig))

config.UNIT_FILE_LOCATIONS = process.env.UNIT_FILE_LOCATIONS || '/etc/systemd/system'
config.SYSTEMCTL_PATH = process.env.SYSTEMCTL_PATH || '/bin/systemctl'

module.exports = Object.freeze(coercer(config))
