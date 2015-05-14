var child_process = require('child_process')
var path = require('path')
var freeport = require('freeport')
var shortId = require('shortid')
var os = require('os')
var rimraf = require('rimraf')
var mkdirp = require('mkdirp')
var logger = require('winston')

module.exports = function startDaemon (callback) {
  freeport(function (error, port) {
    if (error) {
      return callback(error)
    }

    process.env.GUVNOR_URL = 'https://localhost:' + port

    var dir = path.join(os.tmpdir(), shortId.generate())
    mkdirp.sync(path.join(dir, 'plists'))
    var launchctlPath = path.resolve(path.join(__dirname, 'launchd.js'))
    var daemonPath = path.resolve(path.join(__dirname, '..', '..', 'lib', 'daemon', 'index.js'))
    var daemonProcess = child_process.fork(daemonPath, {
      env: {
        PATH: process.env.PATH,
        GUVNOR_LAUNCHCTL_PATH: launchctlPath,
        GUVNOR_PLIST_LOCATIONS: path.join(dir, 'plists'),
        GUVNOR_CONFIG_DIR: path.join(dir, 'config'),
        GUVNOR_LOG_DIR: path.join(dir, 'logs'),
        GUVNOR_RUN_DIR: path.join(dir, 'run'),
        GUVNOR_APP_DIR: path.join(dir, 'apps'),
        GUVNOR_PROCESS_RUN_DIR: path.join(dir, 'run', 'processes'),
        GUVNOR_HTTPS_PORT: port
      },
      silent: true
    })
    daemonProcess.on('error', console.error)
    daemonProcess.on('message', function (event) {
      callback(null, function (callback) {
        daemonProcess.on('exit', function () {
          rimraf(dir, callback)
        })
        daemonProcess.kill()
      })
    })
    daemonProcess.stdout.on('data', function (data) {
      logger.error(data.toString().trim())
    })
    daemonProcess.stderr.on('data', function (data) {
      logger.error(data.toString().trim())
    })
  })
}
