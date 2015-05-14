var plist = require('plist')
var fs = require('fs')
var path = require('path')
var daemonPlistName = require('../../../common/launchd/plist-name')
var toEnv = require('./to-env')

module.exports = function createDaemonPlist (config, callback) {
  var daemonDirectory = path.resolve(path.join(__dirname, '../../../daemon'))
  var args = []

  args.push(process.execPath)

  if (config.debug.daemon) {
    args.push('--debug-brk=' + config.debug.daemon)
  }

  args.push(daemonDirectory)

  var env = toEnv(config)

  env.DEBUG = '*'
  env.GUVNOR_DEBUG_CLUSTER = config.debug.cluster

  delete env.DAEMONISE
  delete env.DAEMONIZE

  for (var key in env) {
    env[key] = env[key].toString()
  }

  // see http://launchd.info
  var definition = {
    Label: 'guvnor',
    // Program: process.execPath,
    ProgramArguments: args,
    KeepAlive: true,
    UserName: config.guvnor.user,
    GroupName: config.guvnor.group,
    // InitGroups: true,
    RunAtLoad: true,
    StandardOutPath: path.join(config.guvnor.logdir, 'guvnor.out.log'),
    StandardErrorPath: path.join(config.guvnor.logdir, 'guvnor.error.log'),
    EnvironmentVariables: env,
    WorkingDirectory: daemonDirectory
  }

  var walkSync = function (dir, filelist) {
    filelist = filelist || []

    fs.readdirSync(dir).forEach(function (file) {
      var fullPath = path.join(dir, file)

      if (fs.statSync(fullPath).isDirectory() && file.substring(0, 1) !== '.') {
        filelist.push(fullPath)
        walkSync(fullPath, filelist)
      }
    })

    return filelist
  }

  definition.WatchPaths = walkSync(path.resolve(path.join(__dirname, '../../../')))

  var contents = plist.build(definition)

  fs.writeFile(daemonPlistName(), contents, {
    mode: parseInt('0644', 8)
  }, callback)
}
