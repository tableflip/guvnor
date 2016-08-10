'use strict'

require('colors')

const logger = require('winston')
const logLevel = (process.argv.indexOf('--verbose') !== -1 || process.argv.indexOf('-v') !== -1) ? 'debug' : 'warn'
logger.level = logLevel
logger.cli()

const config = require('./config')
const pkg = require('../../package.json')
const yargs = require('yargs')
const loadApi = require('../local/api')
const loadUser = require('./load-user')
const async = require('async')
const OutputBuffer = require('output-buffer')
const processStart = require('./process/start')
const processStop = require('./process/stop')
const processRestart = require('./process/restart')
const processRemove = require('./process/remove')
const processLogs = require('./process/logs')
const userAdd = require('./user/add')
const userRemove = require('./user/remove')
const processList = require('./process/list')
const processGc = require('./process/gc')
const processHeap = require('./process/heap')
const appInstall = require('./app/install')
const appList = require('./app/list')
const appRemove = require('./app/remove')
const appRefs = require('./app/refs')
const appRef = require('./app/ref')
const setAppRef = require('./app/set-ref')
const appUpdate = require('./app/update')
const daemonStatus = require('./daemon/status')
const webKey = require('./web/key')

let user

module.exports = (args) => {
  process.on('uncaughtException', (error) => {
    if (error.code === 'EINVALIDCERT') {
      logger.error('Your user certificate is invalid.')
      logger.error(`To regenerate your certificate please run 'sudo guv useradd ${user ? user.name : '$YOUR_USER'}'`)
    } else if (error.code === 'ECONNREFUSED') {
      logger.error('The daemon is not running.')
      logger.error('Please run \'sudo guv\' to start it.')
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
  let readData = false
  const buffer = new OutputBuffer((line) => {
    line = line.trim()

    if (line) {
      run(args.concat(line))
    }
  })

  process.stdin.on('readable', () => {
    buffer.append()

    const chunk = this.read()

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
  process.stdin.once('end', () => {
    buffer.flush()
  })
}

const run = (args) => {
  const argv = yargs(args).argv
  const requestedStatus = argv._.length === 3 && argv._[2] === 'status'

  async.auto({
    user: (next) => {
      loadUser((error, results) => {
        user = results
        next(error, results)
      })
    },
    api: ['user', (results, next) => {
      if (requestedStatus) {
        // do not load the api for status as the daemon might not be running which
        // can result in spurious error messages
        return next()
      }

      loadApi(results.user.keyBundle, next)
    }]
  }, (error, results) => {
    if (error) {
      throw error
    }

    const bind = (fn) => {
      return fn.bind(null, results.user, results.api)
    }

    yargs(args)
      .usage('Usage: $0 <command> [options]')
      .command('start', 'Start a script or app', bind(processStart))
      .command('stop', 'Stop a script or app', bind(processStop))
      .command('restart', 'Restart a script or app', bind(processRestart))
      .command('remove', 'Remove a script or app', bind(processRemove))
      .command('rm', false, bind(processRemove))
      .command('logs', false, bind(processLogs))
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
      .epilog(`${config.DAEMON_NAME} v${pkg.version}`)
      .argv
  })
}
