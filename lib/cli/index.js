'use strict'

require('colors')

const logger = require('winston')
const logLevel = (process.argv.indexOf('--verbose') !== -1 || process.argv.indexOf('-v') !== -1) ? 'debug' : 'warn'
logger.level = logLevel
logger.cli()

const config = require('./config')
const pkg = require('../../package.json')
const yargs = require('yargs')
const processStart = require('./process/start')
const processStop = require('./process/stop')
const processRestart = require('./process/restart')
const processRemove = require('./process/remove')
const processLogs = require('./process/logs')
const processWorkers = require('./process/workers')
const sendEvent = require('./process/send')
const sendSignal = require('./process/signal')
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

module.exports = (certs, args, piped) => {
  return new Promise((resolve, reject) => {
    const bind = (fn) => {
      return yargs => {
        fn(certs, piped, yargs)
        .then(resolve)
        .catch(reject)
      }
    }

    yargs(args)
      .usage('Usage: $0 <command> [options]')
      .command('start', 'Start a script or app', bind(processStart))
      .command('stop', 'Stop a script or app', bind(processStop))
      .command('restart', 'Restart a script or app', bind(processRestart))
      .command('remove', 'Remove a script or app', bind(processRemove))
      .command('rm', false, bind(processRemove))
      .command('logs', false, bind(processLogs))
      .command('workers', 'Set number of process workers', bind(processWorkers))
      .command('send', 'Send an event to a process', bind(sendEvent))
      .command('signal', 'Send a signal to a process', bind(sendSignal))
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
