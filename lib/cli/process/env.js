'use strict'

const config = require('../config')
const pkg = require('../../../package.json')
const stringify = require('json-stringify-safe')
const loadApi = require('../load-api')

module.exports = (certs, piped, yargs) => {
  const argv = yargs
    .usage('Usage: $0 env name')
    .demand(3)
    .example('$0 env foo', 'Show the environment of process foo')
    .example('$0 env foo --json', 'Output environment as json object')

    .describe('json', 'Output list in JSON format')
    .alias('j', 'json')
    .boolean('json')

    .help('h')
    .alias('h', 'help')

    .describe('verbose', 'Prints detailed internal logging output')
    .alias('v', 'verbose')
    .boolean('v')

    .epilog(`${config.DAEMON_NAME} v${pkg.version}`)
    .argv

  const name = argv._[3]

  return loadApi(certs, {}, api => api.process.get(name)
    .then(proc => {
      if (!proc) {
        process.stderr.write(`No process found for ${name}\n`)
        process.exit(1)
      }

      if (!proc.workers) {
        process.stderr.write(`Process ${name} is not running`)
        process.exit(1)
      }

      if (argv.json) {
        return stringify(proc.workers[0].env, null, 2)
      }

      Object.keys(proc.workers[0].env).forEach(key => {
        console.info(`${key}=${proc.workers[0].env[key]}`)
      })
    })
  )
}
