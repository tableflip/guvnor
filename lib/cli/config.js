var coercer = require('coercer')

var config = {
  CONFIG_DIR: process.env.GUVNOR_CONFIG_DIR || '/etc/guvnor'
}

module.exports = Object.freeze(coercer(config))
