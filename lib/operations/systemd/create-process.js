'use strict'

const ini = require('ini')
const fs = require('fs-promise')
const path = require('path')
const os = require('os')
const findCwd = require('../common/lib/find-cwd')
const loadOptions = require('../common/lib/load-options')
const config = require('./config')
const operations = require('../')

const writeFile = (path, contents, callback) => {
  fs.writeFile(path, contents, {
    encoding: 'utf8'
  }, callback)
}

const createUnit = (context, options) => {
  const args = [
    options.interpreter
  ].concat(options.execArgv).concat([
    path.resolve(path.join(__dirname, '../../process-wrapper'))
  ]).concat(options.argv)

  const unit = {
    Unit: {
      Description: options.name
    },
    Service: {
      Type: 'simple',
      Restart: 'always',
      EnvironmentFile: options.envFile,
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

  return unit
}

const createEnv = (context, options) => {
  const env = options.env || {}

  env[`${config.DAEMON_ENV_NAME}_SCRIPT`] = options.script
  env[`${config.DAEMON_ENV_NAME}_PROCESS_NAME`] = options.name
  env[`${config.DAEMON_ENV_NAME}_RUNDIR`] = config.RUN_DIR
  env[`${config.DAEMON_ENV_NAME}_RPC_TIMEOUT`] = '5000'
  env[`${config.DAEMON_ENV_NAME}_RPC_SOCKET`] = path.join(os.tmpdir(), `${options.name}.sock`)
  env[`${config.DAEMON_ENV_NAME}_INSTANCES`] = options.instances

  if (options.url) {
    env[`${config.DAEMON_ENV_NAME}_URL`] = options.url
  }

  env[`${config.DAEMON_ENV_NAME}_KEY_FILE`] = options.keyFile
  env[`${config.DAEMON_ENV_NAME}_CERT_FILE`] = options.certFile
  env[`${config.DAEMON_ENV_NAME}_CA_FILE`] = options.caFile

  return env
}

const systemdCreateProcess = (context, name, options, callback) => {
  options = JSON.parse(JSON.stringify(options))

  options.unitFile = path.join(config.UNIT_FILE_LOCATIONS, `${config.DAEMON_NAME}.${name}.service`)
  options.envFile = path.join(config.UNIT_FILE_LOCATIONS, `${config.DAEMON_NAME}.${name}.env`)
  options.keyFile = path.join(config.UNIT_FILE_LOCATIONS, `${config.DAEMON_NAME}.${name}.key`)
  options.certFile = path.join(config.UNIT_FILE_LOCATIONS, `${config.DAEMON_NAME}.${name}.cert`)
  options.caFile = path.join(config.UNIT_FILE_LOCATIONS, `${config.DAEMON_NAME}.${name}.ca`)

  return findCwd(context, options)
  .then((cwd) => {
    options.cwd = cwd

    return loadOptions(context, options)
  })
  .then(() => Promise.all([
    writeFile(options.unitFile, ini.stringify(createUnit(context, options))),
    writeFile(options.envFile, ini.stringify(createEnv(context, options))),
    writeFile(options.keyFile, options.key),
    writeFile(options.certFile, options.cert),
    writeFile(options.caFile, options.ca)
  ]))
  .then(() => operations.findProcess(context, name))
}

module.exports = systemdCreateProcess
