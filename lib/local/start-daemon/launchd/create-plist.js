'use strict'

const plist = require('plist')
const fs = require('fs')
const path = require('path')
const toEnv = require('./to-env')
const config = require('../../config')

module.exports = function createDaemonPlist (callback) {
  const daemonDirectory = path.resolve(path.join(__dirname, '../../../daemon'))
  const args = []

  args.push(process.execPath)
  args.push(daemonDirectory)

  const env = toEnv(config)

  delete env.DAEMONISE
  delete env.DAEMONIZE

  for (const key in env) {
    env[key] = env[key].toString()
  }

  // see http://launchd.info
  const definition = {
    Label: config.DAEMON_NAME,
    // Program: process.execPath,
    ProgramArguments: args,
    KeepAlive: true,
    UserName: config.DAEMON_USER,
    GroupName: config.DAEMON_GROUP,
    // InitGroups: true,
    RunAtLoad: true,
    StandardOutPath: path.join(config.LOG_DIR, `${config.DAEMON_NAME}.out.log`),
    StandardErrorPath: path.join(config.LOG_DIR, `${config.DAEMON_NAME}.error.log`),
    EnvironmentVariables: env,
    WorkingDirectory: daemonDirectory
  }

  const walkSync = function (dir, filelist) {
    filelist = filelist || []

    fs.readdirSync(dir).forEach(function (file) {
      const fullPath = path.join(dir, file)

      if (fs.statSync(fullPath).isDirectory() && file.substring(0, 1) !== '.') {
        filelist.push(fullPath)
        walkSync(fullPath, filelist)
      }
    })

    return filelist
  }

  definition.WatchPaths = walkSync(path.resolve(path.join(__dirname, '../../../')))

  const contents = plist.build(definition)

  fs.writeFile(`/Library/LaunchDaemons/${config.DAEMON_NAME}.plist`, contents, {
    mode: parseInt('0644', 8)
  }, callback)
}
