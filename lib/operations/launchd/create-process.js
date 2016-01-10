var async = require('async')
var findCwd = require('../common/lib/find-cwd')
var loadOptions = require('../common/lib/load-options')
var plist = require('plist')
var fs = require('fs')
var path = require('path')
var config = require('./config')
var operations = require('../')
var os = require('os')
var DEBUG = require('good-enough').DEBUG
var ERROR = require('good-enough').ERROR
var CONTEXT = 'operations:launchd:create-process'

function createPlist (context, options, callback) {
  var name = config.DAEMON_NAME + '.' + options.name

  context.log([DEBUG, CONTEXT], 'Creating process ' + name)

  var args = [
    options.interpreter
  ].concat(options.execArgv)
    .concat([
      path.resolve(path.join(__dirname, '../../process-wrapper'))
    ]).concat(options.argv)

  var logFile = path.join(config.LOG_DIR, options.name + '.log')

  // see http://launchd.info
  var definition = {
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

  definition.EnvironmentVariables[config.DAEMON_ENV_NAME + '_SCRIPT'] = options.script
  definition.EnvironmentVariables[config.DAEMON_ENV_NAME + '_PROCESS_NAME'] = options.name
  definition.EnvironmentVariables[config.DAEMON_ENV_NAME + '_RPC_TIMEOUT'] = '5000'
  definition.EnvironmentVariables[config.DAEMON_ENV_NAME + '_RPC_SOCKET'] = path.join(os.tmpdir(), name + '.sock')
  definition.EnvironmentVariables[config.DAEMON_ENV_NAME + '_INSTANCES'] = '' + options.instances

  if (options.url) {
    definition.EnvironmentVariables[config.DAEMON_ENV_NAME + '_URL'] = options.url
  }

  if (options.cert) {
    definition.EnvironmentVariables[config.DAEMON_ENV_NAME + '_CERT'] = options.cert
  }

  if (options.key) {
    definition.EnvironmentVariables[config.DAEMON_ENV_NAME + '_KEY'] = options.key
  }

  if (options.ca) {
    definition.EnvironmentVariables[config.DAEMON_ENV_NAME + '_CA'] = options.ca
  }

  if (options.chroot) {
    definition.RootDirectory = options.cwd
  }

  var contents

  try {
    contents = plist.build(definition) + '\n'
  } catch (e) {
    context.log([ERROR, CONTEXT], 'Could not create plist from ' + definition)
    context.log([ERROR, CONTEXT], e)

    return callback(e)
  }

  var plistFile = path.join(config.PLIST_LOCATIONS, name + '.plist')

  context.log([DEBUG, CONTEXT], 'Creating plist file at ' + plistFile)

  fs.writeFile(plistFile, contents, {
    mode: parseInt('0644', 8),
    flag: 'wx'
  }, callback)
}

function configureLogRotation (context, options, callback) {
  var logFile = path.join(config.LOG_DIR, options.name + '.log')
  var rotateFile = path.join(config.NEWSYSLOGD_PATH, config.DAEMON_NAME + '.' + options.name + '.conf')
  var contents = [
    '# logfilename\t\t[owner:group]\tmode\tcount\tsize\twhen\tflags\t[/pid_file]\t[sig_num]',
    logFile + '\t640\t7\t*\t$D0\tZ',
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
