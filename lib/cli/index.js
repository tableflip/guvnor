require('colors')

var logger = require('winston')
var logLevel = (process.argv.indexOf('--verbose') !== -1 || process.argv.indexOf('-v') !== -1) ? 'debug' : 'warn'
logger.level = logLevel
logger.cli()

var pkg = require('../../package.json')
// var connectOrStart = require('../local').connectOrStart
// var running = require('../local').running
// var stopDaemon = require('../local').stopDaemon
var yargs = require('yargs')
var platformOperations = require('../platform-operations')
var loadApi = require('./load-api')
var async = require('async')

var processStart = require('./process/start')
var processStop = require('./process/stop')
var processRemove = require('./process/remove')
var userAdd = require('./user/add')
var userRemove = require('./user/remove')
var processList = require('./process/list')
var processGc = require('./process/gc')
var processHeap = require('./process/heap')
var appInstall = require('./app/install')
var appList = require('./app/list')
var appRemove = require('./app/remove')
var appRefs = require('./app/refs')
var appRef = require('./app/ref')

module.exports = function (args) {
  process.on('uncaughtException', function (error) {
    if (logLevel === 'debug') {
      logger.error(error.stack)
    } else if (error.message && error.message !== 'undefined') {
      logger.error(error.message)
    } else {
      logger.error(error)
    }

    process.exit(1)
  })

  async.parallel({
    user: platformOperations.findUserDetails.bind(null, process.getuid()),
    api: loadApi
  }, function (error, results) {
    if (error) {
      throw error
    }

    function bind (fn) {
      return fn.bind(null, results.user, results.api)
    }

    yargs(args)
      .usage('Usage: $0 <command> [options]')
      .command('start', 'Start a script or app', bind(processStart))
      .command('stop', 'Stop a script or app', bind(processStop))
      .command('remove', 'Remove a script or app', bind(processRemove))
      .command('rm', false, bind(processRemove))
      .command('useradd', 'Add a user', bind(userAdd))
      .command('adduser', false, bind(userAdd))
      .command('rmuser', 'Add remove a users', bind(userRemove))
      .command('list', 'List running processes', bind(processList))
      .command('status', false, bind(processList))
      .command('ls', false, bind(processList))
      .command('gc', 'Force a process to collect garbage', bind(processGc))
      .command('heap', 'Take a snapshot of the process heap', bind(processHeap))
      .command('install', 'Install an app', bind(appInstall))
      .command('rmapp', 'Remove an app', bind(appRemove))
      .command('lsapps', 'List installed apps', bind(appList))
      .command('lsapp', false, bind(appList))
      .command('lsrefs', 'List app refs', bind(appRefs))
      .command('lsref', 'List app current ref', bind(appRef))

      .demand(4, 'Please enter a subcommand')
      .example('$0 start script.js', 'Start a script')
      .example('$0 stop script.js', 'Stop a script')
      .example('$0 list', 'Show all running scripts')
      .help('h')
      .alias('h', 'help')
      .epilog('Guvnor v' + pkg.version)
      .argv
  })
}
