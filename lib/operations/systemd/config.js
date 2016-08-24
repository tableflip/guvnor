'use strict'

const coercer = require('coercer')
const commonConfig = require('../config')
const config = JSON.parse(JSON.stringify(commonConfig))

config.UNIT_FILE_LOCATIONS = process.env.UNIT_FILE_LOCATIONS || '/etc/systemd/system'
config.SYSTEMCTL_PATH = process.env.SYSTEMCTL_PATH || '/bin/systemctl'
config.JOURNALCTL_PATH = process.env.JOURNALCTL_PATH || '/bin/journalctl'

module.exports = Object.freeze(coercer(config))
