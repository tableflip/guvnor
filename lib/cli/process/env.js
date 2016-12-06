'use strict'

const config = require('../config')
const pkg = require('../../../package.json')
const stringify = require('json-stringify-safe')
const Table = require('./Table')
const moment = require('moment')
const formatMemory = require('prettysize')
const loadApi = require('../load-api')

module.exports = (certs, piped, yargs) => {
  const argv = yargs
    .usage('Usage: $0 env name')
    .demand(3)
    .example('$0 env foo', 'Show the environment of process foo')

    .help('h')
    .alias('h', 'help')

    .describe('verbose', 'Prints detailed internal logging output')
    .alias('v', 'verbose')
    .boolean('v')

    .epilog(`${config.DAEMON_NAME} v${pkg.version}`)
    .argv

  return loadApi(certs, {
  }, api => api.process.get(argv._[3])
    .then(process => {
      if (!process) {
        return `No process found for ${argv._[3]}`
      }

      if (!process.workers) {
        return `Process ${argv._[3]} is not running`
      }

      Object.keys(process.workers[0].env).forEach(key => {
        console.info(`${key}=${process.workers[0].env[key]}`)
      })
    })
  )
}
