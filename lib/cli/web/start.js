'use strict'

const config = require('../config')
const pkg = require('../../../package.json')
const path = require('path')
const loadApi = require('../load-api')

module.exports = (certs, piped, yargs) => {
  const argv = yargs
    .usage('Usage: $0 web [options]')
    .demand(3, 'Please specify a command')
    .example('$0 web', 'Starts the web monitor')

    .describe('group', 'The group to start a process as')
    .alias('g', 'group')

    .help('h')
    .alias('h', 'help')

    .describe('verbose', 'Prints detailed internal logging output')
    .alias('v', 'verbose')
    .boolean('v')

    .epilog(`${config.DAEMON_NAME} v${pkg.version}`)
    .argv

  const name = 'guv-web'
  const script = path.resolve(path.join(__dirname, '..', '..', 'web'))
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
    workers: 1,
    name: name,
    env: env
  })
    .then(proc => `Process ${proc.name} started`)
  )
}
