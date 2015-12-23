require('colors')

var logger = require('winston')
var logLevel = (process.argv.indexOf('--verbose') !== -1 || process.argv.indexOf('-v') !== -1) ? 'debug' : 'warn'
logger.level = logLevel
logger.cli()

var pkg = require('../../package.json')
var yargs = require('yargs')
var loadApi = require('../local/api')
var loadUser = require('./load-user')
var async = require('async')
var OutputBuffer = require('output-buffer')
var processStart = require('./process/start')
var processStop = require('./process/stop')
var processRestart = require('./process/restart')
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
var setAppRef = require('./app/set-ref')
var appUpdate = require('./app/update')
var daemonStatus = require('./daemon/status')
var webKey = require('./web/key')

var user

module.exports = function (args) {
  process.on('uncaughtException', function (error) {
    if (error.code === 'EINVALIDCERT') {
      logger.error('Your user certificate is invalid.')
      logger.error('To regenerate your certificate please run `sudo guv useradd %s`', user ? user.name : '$YOUR_USER')
    } else if (error.code === 'ECONNREFUSED') {
      logger.error('The daemon is not running.')
      logger.error('Please run `sudo guv` to start it.')
    } else if (logLevel === 'debug') {
      logger.error(error.stack)
    } else if (error.message && error.message !== 'undefined') {
      logger.error(error.message)
    } else {
      logger.error(error)
    }

    process.exit(1)
  })

  // to support piping..
  var readData = false
  var buffer = new OutputBuffer(function (line) {
    line = line.trim()

    if (line) {
      run(args.concat(line))
    }
  })

  process.stdin.on('readable', function () {
    buffer.append()

    var chunk = this.read()

    if (chunk === null) {
      if (buffer.size() === 0 && !readData) {
        // not being piped to
        run(args)
        process.stdin.destroy()
      } else {
        buffer.flush()
      }
    } else {
      readData = true
      buffer.append(chunk)
    }
  })
  process.stdin.once('end', function () {
    buffer.flush()
  })
}

function run (args) {
  var argv = yargs(args).argv
  var requestedStatus = argv._.length === 3 && argv._[2] === 'status'

  async.auto({
    user: function (next) {
      loadUser(function (error, results) {
        user = results
        next(error, results)
      })
    },
    api: ['user', function (next, results) {
      if (requestedStatus) {
        // do not load the api for status as the daemon might not be running which
        // can result in spurious error messages
        return next()
      }

      loadApi(results.user.keyBundle, next)
    }]
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
      .command('restart', 'Restart a script or app', bind(processRestart))
      .command('remove', 'Remove a script or app', bind(processRemove))
      .command('rm', false, bind(processRemove))
      .command('useradd', 'Add a user', bind(userAdd))
      .command('adduser', false, bind(userAdd))
      .command('rmuser', 'Add remove a users', bind(userRemove))
      .command('list', 'List running processes', bind(processList))
      .command('ls', false, bind(processList))
      .command('gc', 'Force a process to collect garbage', bind(processGc))
      .command('heap', 'Take a snapshot of the process heap', bind(processHeap))
      .command('install', 'Install an app', bind(appInstall))
      .command('rmapp', 'Remove an app', bind(appRemove))
      .command('lsapps', 'List installed apps', bind(appList))
      .command('lsapp', false, bind(appList))
      .command('lsrefs', 'List app refs', bind(appRefs))
      .command('lsref', 'List app current ref', bind(appRef))
      .command('update', 'Update an app\'s avaiable refs', bind(appUpdate))
      .command('setref', 'Set the current ref for an app', bind(setAppRef))
      .command('status', false, bind(daemonStatus))
      .command('webkey', 'Generate a pkcs12 keybundle to access the web interface', bind(webKey))

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
