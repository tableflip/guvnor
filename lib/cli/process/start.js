'use strict'

const config = require('../config')
const pkg = require('../../../package.json')
const path = require('path')
const loadApi = require('../../local/api')

module.exports = (certs, yargs) => {
  const argv = yargs
    .usage('Usage: $0 start [options] <script>')
    .demand(4)
    .example('$0 start hello.js', 'Start a script')
    .example('$0 start -n goodbye hello.js', 'Start a script with a name')

    .help('h')
    .alias('h', 'help')

    .describe('group', 'The group to start a process as')
    .alias('g', 'group')

    .describe('cwd', 'The current working directory for the script')
    .alias('c', 'cwd')

    .describe('workers', 'How many workers of the process to start')
    .alias('w', 'workers')
    .default('w', 1)

    .describe('name', 'What name to give the process')
    .alias('n', 'name')

    .describe('argv', 'A space separated list of arguments to pass to a process')
    .alias('a', 'argv')
    .array('a')
    .default('a', [])

    .describe('execArgv', 'A space separated list of arguments to pass to the node exectuable')
    .alias('e', 'execArgv')
    .array('e')
    .default('e', [])

    .describe('interpreter', 'Which node version to use')
    .alias('i', 'interpreter')

    .describe('debug', 'Pause the process at the start of execution and wait for a debugger to be attached')
    .alias('d', 'debug')
    .boolean('d')

    .describe('chroot', 'A path to a folder which will form a chroot jail for the process')
    .alias('r', 'chroot')

    .describe('verbose', 'Prints detailed internal logging output')
    .alias('v', 'verbose')
    .boolean('v')

    .epilog(`${config.DAEMON_NAME} v${pkg.version}`)
    .argv

  let script = yargs.argv._[3]

  if (!path.isAbsolute(script)) {
    script = path.resolve(path.join(process.cwd(), script))
  }

  return loadApi(certs)
  .then(api => {
    return api.process.start(script, {
      group: argv.group,
      workers: argv.workers,
      name: argv.name,
      argv: argv.argv,
      execArgv: argv.execArgv,
      debug: argv.debug,
      env: process.env,
      chroot: argv.chroot,
      cwd: argv.cwd,
      interpreter: argv.interpreter
    })
    .then(proc => {
      api.disconnect()

      return `Process ${proc.name} started`
    })
  })
}
