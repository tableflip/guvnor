'use strict'

const config = require('../config')
const pkg = require('../../../package.json')
const path = require('path')
const loadApi = require('../load-api')
const processNameFromScript = require('../../common/process-name-from-script')
const fs = require('fs-promise')

const findScript = (script) => {
  if (path.isAbsolute(script)) {
    return Promise.resolve(script)
  }

  const absoluteScript = path.resolve(path.join(process.cwd(), script))

  return fs.exists(absoluteScript)
  .then(exists => exists ? absoluteScript : script)
}

module.exports = (certs, piped, yargs) => {
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
    .global('argv')
    .default('a', [])

    .describe('execArgv', 'A space separated list of arguments to pass to the node exectuable')
    .alias('e', 'execArgv')
    .array('e')
    .global('execArgv')
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

  return findScript(argv._[3])
  .then(script => {
    const name = processNameFromScript(argv.name || script)
    const env = {}

    // filter some keys from the environment
    Object.keys(process.env)
    .filter(key => key.substring(0, 3) !== 'npm')
    .filter(key => key.substring(0, 3) !== 'nvm')
    .filter(key => key.substring(0, 1) !== '_')
    .forEach(key => {
      env[key] = process.env[key]
    })

    return loadApi(certs, {
      404: `No process found for ${name}`,
      409: `${name} is already running`
    }, api => api.process.start(script, {
      group: argv.group,
      workers: argv.workers,
      name: name,
      argv: argv.argv,
      execArgv: argv.execArgv,
      debug: argv.debug,
      env: env,
      chroot: argv.chroot,
      cwd: argv.cwd,
      interpreter: argv.interpreter
    })
      .then(proc => `Process ${proc.name} started`)
    )
  })
}
