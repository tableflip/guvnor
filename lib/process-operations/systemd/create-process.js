var async = require('async')
var findCwd = require('../common/find-cwd')
var loadOptions = require('../common/load-options')
var ini = require('ini')
var fs = require('fs')
var path = require('path')
var config = require('./config')
var logger = require('winston')
var processOperations = require('../')

function writeFile (path, contents, callback) {
  fs.writeFile(path, contents, {
    encoding: 'utf8'
  }, callback)
}

module.exports = function systemdCreateProcess (user, options, callback) {
  var unitFile = path.join(config.UNIT_FILE_LOCATIONS, 'guvnor.' + options.name + '.service')
  var envFile = path.join(config.UNIT_FILE_LOCATIONS, 'guvnor.' + options.name + '.env')
  var keyFile = path.join(config.UNIT_FILE_LOCATIONS, 'guvnor.' + options.name + '.key')
  var certFile = path.join(config.UNIT_FILE_LOCATIONS, 'guvnor.' + options.name + '.cert')
  var caFile = path.join(config.UNIT_FILE_LOCATIONS, 'guvnor.' + options.name + '.ca')

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
      User: user.name,
      Group: options.group || user.group,
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

  env.GUVNOR_SCRIPT = options.script
  env.GUVNOR_PROCESS_NAME = options.name
  env.GUVNOR_RUNDIR = '/var/run/guvnor'
  env.GUVNOR_RPC_TIMEOUT = '5000'

  if (options.url) {
    env.GUVNOR_URL = options.url
  }

  env.GUVNOR_KEY_FILE = keyFile
  env.GUVNOR_CERT_FILE = certFile
  env.GUVNOR_CA_FILE = caFile

  async.auto({
    writeUnitFile: writeFile.bind(null, unitFile, ini.stringify(unit)),
    writeEnvFile: writeFile.bind(null, envFile, ini.stringify(env)),
    writeKeyFile: writeFile.bind(null, keyFile, options.key),
    writeCertFile: writeFile.bind(null, certFile, options.cert),
    writeCaFile: writeFile.bind(null, caFile, options.ca),
    getProcess: ['writeUnitFile', 'writeEnvFile', 'writeKeyFile', 'writeCertFile', 'writeCaFile', function (next, results) {
      processOperations.findProcess(user, options.name, next)
    }]
  }, function (error, results) {
    callback(error, results ? results.getProcess : null)
  })
}
