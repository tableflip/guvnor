var coercer = require('coercer')
var path = require('path')

var name = process.env.DAEMON_NAME || 'guvnor'

var config = {
  DAEMON_NAME: name,
  DAEMON_ENV_NAME: name.toUpperCase(),
  CONFIG_DIR: process.env.CONFIG_DIR || path.join('/etc', name),
  LOG_DIR: process.env.LOG_DIR || path.join('/var', 'log', name),
  RUN_DIR: process.env.RUN_DIR || path.join('/var', 'run', name),
  DAEMON_URL: process.env.DAEMON_URL || 'https://localhost:8001'
}

module.exports = Object.freeze(coercer(config))
