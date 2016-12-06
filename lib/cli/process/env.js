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

  return loadApi(certs, {
    404: `No process found for ${name}`
  }, api => api.process.get(argv._[3])
    .then(process => {
      if (!process.workers) {
        throw new Error(`Process ${argv._[3]} is not running`)
      }

      if (argv.json) {
        return stringify(process.workers[0].env, null, 2)
      }

      Object.keys(process.workers[0].env).forEach(key => {
        console.info(`${key}=${process.workers[0].env[key]}`)
      })
    })
  )
}
