'use strict'

const async = require('async')
const findCwd = require('../common/lib/find-cwd')
const loadOptions = require('../common/lib/load-options')
const plist = require('plist')
const fs = require('fs')
const path = require('path')
const config = require('./config')
const operations = require('../')
const os = require('os')
const DEBUG = require('good-enough').DEBUG
const ERROR = require('good-enough').ERROR
const CONTEXT = 'operations:launchd:create-process'

function createPlist (context, name, options, callback) {
  name = `${config.DAEMON_NAME}.${name}`

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
    definition.Environmentconstiables = options.env
  } else {
    definition.Environmentconstiables = {}
  }

  definition.Environmentconstiables[`${config.DAEMON_ENV_NAME}_SCRIPT`] = options.script
  definition.Environmentconstiables[`${config.DAEMON_ENV_NAME}_PROCESS_NAME`] = options.name
  definition.Environmentconstiables[`${config.DAEMON_ENV_NAME}_RPC_TIMEOUT`] = '5000'
  definition.Environmentconstiables[`${config.DAEMON_ENV_NAME}_RPC_SOCKET`] = path.join(os.tmpdir(), `${name}.sock`)
  definition.Environmentconstiables[`${config.DAEMON_ENV_NAME}_INSTANCES`] = `${options.instances}`

  if (options.url) {
    definition.Environmentconstiables[`${config.DAEMON_ENV_NAME}_URL`] = options.url
  }

  if (options.cert) {
    definition.Environmentconstiables[`${config.DAEMON_ENV_NAME}_CERT`] = options.cert
  }

  if (options.key) {
    definition.Environmentconstiables[`${config.DAEMON_ENV_NAME}_KEY`] = options.key
  }

  if (options.ca) {
    definition.Environmentconstiables[`${config.DAEMON_ENV_NAME}_CA`] = options.ca
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

    return callback(e)
  }

  const plistFile = path.join(config.PLIST_LOCATIONS, `${name}.plist`)

  context.log([DEBUG, CONTEXT], `Creating plist file at ${plistFile}`)

  fs.writeFile(plistFile, contents, {
    mode: parseInt('0644', 8),
    flag: 'wx'
  }, callback)
}

function configureLogRotation (context, options, callback) {
  const logFile = path.join(config.LOG_DIR, `${options.name}.log`)
  const rotateFile = path.join(config.NEWSYSLOGD_PATH, `${config.DAEMON_NAME}.${options.name}.conf`)
  const contents = [
    '# logfilename\t\t[owner:group]\tmode\tcount\tsize\twhen\tflags\t[/pid_file]\t[sig_num]',
    `${logFile}\t640\t7\t*\t$D0\tZ`,
    ''
  ]

  fs.writeFile(rotateFile, contents.join('\n'), callback)
}

module.exports = function launchdCreateProcess (context, options, callback) {
  async.series([
    findCwd.bind(null, context, options),
    loadOptions.bind(null, context, options),
    createPlist.bind(null, context, options),
    configureLogRotation.bind(null, context, options),
    operations.findProcess.bind(null, context, options.name)
  ], function (error, results) {
    callback(error, results ? results[3] : null)
  })
}
