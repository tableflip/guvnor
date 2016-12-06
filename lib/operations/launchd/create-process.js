'use strict'

const findCwd = require('../common/lib/find-cwd')
const loadOptions = require('../common/lib/load-options')
const plist = require('plist')
const fs = require('fs-promise')
const path = require('path')
const config = require('./config')
const operations = require('../')
const os = require('os')
const DEBUG = require('good-enough').DEBUG
const ERROR = require('good-enough').ERROR
const CONTEXT = 'operations:launchd:create-process'

const createPlist = (context, options) => {
  const name = `${config.DAEMON_NAME}.${options.name}`

  context.log([DEBUG, CONTEXT], `Creating process ${name}`)

  const args = [
    options.interpreter
  ].concat(options.execArgv)
    .concat([
      path.resolve(path.join(__dirname, '../../process-wrapper'))
    ]).concat(options.argv)

  const logFile = path.join(config.LOG_DIR, `${options.name}.log`)

  // see http://launchd.info
  const definition = {
    Label: name,
    ProgramArguments: args,
    StandardOutPath: logFile,
    StandardErrorPath: logFile,
    KeepAlive: true,
    UserName: context.user.name,
    GroupName: options.group || context.user.group,
    InitGroups: options.group === context.user.group,
    WorkingDirectory: options.cwd
  }

  if (options.env) {
    definition.EnvironmentVariables = options.env
  } else {
    definition.EnvironmentVariables = {}
  }

  definition.EnvironmentVariables[`${config.DAEMON_ENV_NAME}_SCRIPT`] = options.script
  definition.EnvironmentVariables[`${config.DAEMON_ENV_NAME}_PROCESS_NAME`] = options.name
  definition.EnvironmentVariables[`${config.DAEMON_ENV_NAME}_RPC_TIMEOUT`] = '5000'
  definition.EnvironmentVariables[`${config.DAEMON_ENV_NAME}_RPC_SOCKET`] = path.join(os.tmpdir(), `${name}.sock`)
  definition.EnvironmentVariables[`${config.DAEMON_ENV_NAME}_WORKERS`] = `${options.workers}`

  if (options.url) {
    definition.EnvironmentVariables[`${config.DAEMON_ENV_NAME}_URL`] = options.url
  }

  if (options.cert) {
    definition.EnvironmentVariables[`${config.DAEMON_ENV_NAME}_CERT`] = options.cert
  }

  if (options.key) {
    definition.EnvironmentVariables[`${config.DAEMON_ENV_NAME}_KEY`] = options.key
  }

  if (options.ca) {
    definition.EnvironmentVariables[`${config.DAEMON_ENV_NAME}_CA`] = options.ca
  }

  if (options.chroot) {
    definition.RootDirectory = options.cwd
  }

  let contents

  try {
    contents = `${plist.build(definition)}\n`
  } catch (e) {
    context.log([ERROR, CONTEXT], `Could not create plist from ${definition}`)
    context.log([ERROR, CONTEXT], e)

    return Promise.reject(e)
  }

  const plistFile = path.join(config.PLIST_LOCATIONS, `${name}.plist`)

  context.log([DEBUG, CONTEXT], `Creating plist file at ${plistFile}`)

  return fs.writeFile(plistFile, contents, {
    mode: parseInt('0644', 8),
    flag: 'wx'
  })
}

const configureLogRotation = (context, options) => {
  const logFile = path.join(config.LOG_DIR, `${options.name}.log`)
  const rotateFile = path.join(config.NEWSYSLOGD_PATH, `${config.DAEMON_NAME}.${options.name}.conf`)
  const contents = [
    '# logfilename\t\t[owner:group]\tmode\tcount\tsize\twhen\tflags\t[/pid_file]\t[sig_num]',
    `${logFile}\t640\t7\t*\t$D0\tZ`,
    ''
  ]

  return fs.writeFile(rotateFile, contents.join('\n'))
}

const launchdCreateProcess = (context, options, callback) => {
  return findCwd(context, options)
  .then((cwd) => {
    options.cwd = cwd

    return loadOptions(context, options)
  })
  .then(() => createPlist(context, options))
  .then(() => configureLogRotation(context, options))
  .then(() => operations.findProcess(context, options.name))
}

module.exports = launchdCreateProcess
