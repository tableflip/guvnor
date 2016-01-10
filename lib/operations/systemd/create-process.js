var async = require('async')
var ini = require('ini')
var fs = require('fs')
var path = require('path')
var config = require('./config')
var operations = require('../')

function writeFile (path, contents, callback) {
  fs.writeFile(path, contents, {
    encoding: 'utf8'
  }, callback)
}

module.exports = function systemdCreateProcess (context, options, callback) {
  var unitFile = path.join(config.UNIT_FILE_LOCATIONS, config.DAEMON_NAME + '.' + options.name + '.service')
  var envFile = path.join(config.UNIT_FILE_LOCATIONS, config.DAEMON_NAME + '.' + options.name + '.env')
  var keyFile = path.join(config.UNIT_FILE_LOCATIONS, config.DAEMON_NAME + '.' + options.name + '.key')
  var certFile = path.join(config.UNIT_FILE_LOCATIONS, config.DAEMON_NAME + '.' + options.name + '.cert')
  var caFile = path.join(config.UNIT_FILE_LOCATIONS, config.DAEMON_NAME + '.' + options.name + '.ca')

  var args = [
    options.interpreter
  ].concat(options.execArgv).concat([
    path.resolve(path.join(__dirname, '../../process-wrapper'))
  ]).concat(options.argv)

  var unit = {
    Unit: {
      Description: options.name
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

  var env = options.env || {}

  env[config.DAEMON_ENV_NAME + '_SCRIPT'] = options.script
  env[config.DAEMON_ENV_NAME + '_PROCESS_NAME'] = options.name
  env[config.DAEMON_ENV_NAME + '_RUNDIR'] = config.RUN_DIR
  env[config.DAEMON_ENV_NAME + '_RPC_TIMEOUT'] = '5000'
  env[config.DAEMON_ENV_NAME + '_INSTANCES'] = options.instances

  if (options.url) {
    env[config.DAEMON_ENV_NAME + '_URL'] = options.url
  }

  env[config.DAEMON_ENV_NAME + '_KEY_FILE'] = keyFile
  env[config.DAEMON_ENV_NAME + '_CERT_FILE'] = certFile
  env[config.DAEMON_ENV_NAME + '_CA_FILE'] = caFile

  async.auto({
    writeUnitFile: writeFile.bind(null, unitFile, ini.stringify(unit)),
    writeEnvFile: writeFile.bind(null, envFile, ini.stringify(env)),
    writeKeyFile: writeFile.bind(null, keyFile, options.key),
    writeCertFile: writeFile.bind(null, certFile, options.cert),
    writeCaFile: writeFile.bind(null, caFile, options.ca),
    getProcess: ['writeUnitFile', 'writeEnvFile', 'writeKeyFile', 'writeCertFile', 'writeCaFile', function (next, results) {
      operations.findProcess(context, options.name, next)
    }]
  }, function (error, results) {
    callback(error, results ? results.getProcess : null)
  })
}
