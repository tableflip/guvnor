var async = require('async')
var findCwd = require('../common/lib/find-cwd')
var loadOptions = require('../common/lib/load-options')
var plist = require('plist')
var fs = require('fs')
var path = require('path')
var config = require('./config')
var logger = require('winston')
var operations = require('../')
var os = require('os')

function createPlist (user, options, callback) {
  var name = 'guvnor.' + options.name
  var args = [
    options.interpreter
  ].concat(options.execArgv)
  .concat(['--perf-basic-prof'])
  .concat([
    path.resolve(path.join(__dirname, '../../process-wrapper'))
  ]).concat(options.argv)

  // see http://launchd.info
  var definition = {
    Label: name,
    ProgramArguments: args,
    KeepAlive: true,
    UserName: user.name,
    GroupName: options.group || user.group,
    InitGroups: options.group === user.group,
    WorkingDirectory: options.cwd,
    StandardOutPath: '/var/log/guvnor/' + name + '.log',
    StandardErrorPath: '/var/log/guvnor/' + name + '.error.log'
  }

  if (options.env) {
    definition.EnvironmentVariables = options.env
  } else {
    definition.EnvironmentVariables = {}
  }

  definition.EnvironmentVariables.GUVNOR_SCRIPT = options.script
  definition.EnvironmentVariables.GUVNOR_PROCESS_NAME = options.name
  definition.EnvironmentVariables.GUVNOR_RPC_TIMEOUT = '5000'
  definition.EnvironmentVariables.GUVNOR_RPC_SOCKET = path.join(os.tmpdir(), name + '.sock')
  definition.EnvironmentVariables.GUVNOR_INSTANCES = '' + options.instances

  if (options.url) {
    definition.EnvironmentVariables.GUVNOR_URL = options.url
  }

  if (options.cert) {
    definition.EnvironmentVariables.GUVNOR_CERT = options.cert
  }

  if (options.key) {
    definition.EnvironmentVariables.GUVNOR_KEY = options.key
  }

  if (options.ca) {
    definition.EnvironmentVariables.GUVNOR_CA = options.ca
  }

  if (options.chroot) {
    definition.RootDirectory = options.cwd
  }

  var contents

  try {
    contents = plist.build(definition) + '\n'
  } catch (e) {
    logger.error('Could not create plist from')
    logger.error(definition)
    return callback(e)
  }

  var plistFile = path.join(config.PLIST_LOCATIONS, name + '.plist')

  logger.debug('Creating plist file at', plistFile)

  fs.writeFile(plistFile, contents, {
    mode: parseInt('0644', 8),
    flag: 'wx'
  }, callback)
}

module.exports = function launchdCreateProcess (user, options, callback) {
  async.series([
    findCwd.bind(null, user, options),
    loadOptions.bind(null, user, options),
    createPlist.bind(null, user, options),
    operations.findProcess.bind(null, user, options.name)
  ], function (error, results) {
    callback(error, results ? results[3] : null)
  })
}
