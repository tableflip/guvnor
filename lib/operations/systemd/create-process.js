'use strict'

const async = require('async')
const ini = require('ini')
const fs = require('fs')
const path = require('path')
const os = require('os')
const config = require('./config')
const operations = require('../')

const writeFile = (path, contents, callback) => {
  fs.writeFile(path, contents, {
    encoding: 'utf8'
  }, callback)
}

module.exports = function systemdCreateProcess (context, name, options, callback) {
  const unitFile = path.join(config.UNIT_FILE_LOCATIONS, `${config.DAEMON_NAME}.${name}.service`)
  const envFile = path.join(config.UNIT_FILE_LOCATIONS, `${config.DAEMON_NAME}.${name}.env`)
  const keyFile = path.join(config.UNIT_FILE_LOCATIONS, `${config.DAEMON_NAME}.${name}.key`)
  const certFile = path.join(config.UNIT_FILE_LOCATIONS, `${config.DAEMON_NAME}.${name}.cert`)
  const caFile = path.join(config.UNIT_FILE_LOCATIONS, `${config.DAEMON_NAME}.${name}.ca`)

  const args = [
    options.interpreter
  ].concat(options.execArgv).concat([
    path.resolve(path.join(__dirname, '../../process-wrapper'))
  ]).concat(options.argv)

  const unit = {
    Unit: {
      Description: name
    },
    Service: {
      Type: 'simple',
      Restart: 'always',
      EnvironmentFile: envFile,
      User: context.user.name,
      Group: options.group || context.user.group,
      WorkingDirectory: options.cwd,
      ExecStart: args.join(' '),
      StandardOutput: 'syslog',
      StandardError: 'syslog'
    },
    Install: {
      // start at boot, similar to run level 3
      WantedBy: 'multi-user.target'
    }
  }

  if (options.chroot) {
    unit.Service.RootDirectory = options.chroot
  }

  const env = options.env || {}

  env[`${config.DAEMON_ENV_NAME}_SCRIPT`] = options.script
  env[`${config.DAEMON_ENV_NAME}_PROCESS_NAME`] = name
  env[`${config.DAEMON_ENV_NAME}_RUNDIR`] = config.RUN_DIR
  env[`${config.DAEMON_ENV_NAME}_RPC_TIMEOUT`] = '5000'
  env[`${config.DAEMON_ENV_NAME}_RPC_SOCKET`] = path.join(os.tmpdir(), `${name}.sock`)
  env[`${config.DAEMON_ENV_NAME}_INSTANCES`] = options.instances

  if (options.url) {
    env[`${config.DAEMON_ENV_NAME}_URL`] = options.url
  }

  env[`${config.DAEMON_ENV_NAME}_KEY_FILE`] = keyFile
  env[`${config.DAEMON_ENV_NAME}_CERT_FILE`] = certFile
  env[`${config.DAEMON_ENV_NAME}_CA_FILE`] = caFile

  async.auto({
    writeUnitFile: writeFile.bind(null, unitFile, ini.stringify(unit)),
    writeEnvFile: writeFile.bind(null, envFile, ini.stringify(env)),
    writeKeyFile: writeFile.bind(null, keyFile, options.key),
    writeCertFile: writeFile.bind(null, certFile, options.cert),
    writeCaFile: writeFile.bind(null, caFile, options.ca),
    getProcess: ['writeUnitFile', 'writeEnvFile', 'writeKeyFile', 'writeCertFile', 'writeCaFile', (results, next) => {
      operations.findProcess(context, name, next)
    }]
  }, (error, results) => {
    callback(error, results ? results.getProcess : null)
  })
}
