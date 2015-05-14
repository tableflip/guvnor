var coercer = require('coercer')

var config = {
  CONFIG_DIR: process.env.GUVNOR_CONFIG_DIR || '/etc/guvnor',
  LOG_DIR: process.env.GUVNOR_LOG_DIR || '/var/log/guvnor',
  RUN_DIR: process.env.GUVNOR_RUN_DIR || '/var/run/guvnor',
  APP_DIR: process.env.GUVNOR_APP_DIR || '/usr/local/guvnor',
  PROCESS_RUN_DIR: process.env.GUVNOR_PROCESS_RUN_DIR || '/var/run/guvnor/processes',
  RPC_TIMEOUT: process.env.GUVNOR_RPC_TIMEOUT || 5000,
  CA_CERTIFICATE: process.env.GUVNOR_CA_CERTIFICATE,
  CA_KEY: process.env.GUVNOR_CA_KEY,
  CA_PASSPHRASE: process.env.GUVNOR_CA_PASSPHRASE,
  HTTPS_PORT: process.env.GUVNOR_HTTPS_PORT || 8001,
  GIT_PATH: process.env.GUVNOR_GIT_PATH || 'git',
  NPM_PATH: process.env.GUVNOR_NPM_PATH || 'npm'
}

module.exports = Object.freeze(coercer(config))
