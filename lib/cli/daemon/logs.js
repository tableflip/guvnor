'use strict'

const config = require('../config')
const pkg = require('../../../package.json')
const loadApi = require('../../local/api')

module.exports = (certs, piped, yargs) => {
  yargs
    .usage('Usage: $0 logs [options]')
    .demand(3)
    .example('$0 logs', 'Show logs for all managed processes')

    .help('h')
    .alias('h', 'help')

    .describe('verbose', 'Prints detailed internal logging output')
    .alias('v', 'verbose')
    .boolean('v')

    .epilog(`${config.DAEMON_NAME} v${pkg.version}`)
    .argv

  return loadApi(certs)
  .then(api => {
    return api.daemon.logs()
    .then(() => {
      api.disconnect()

      return 'All logs'
    })
    .catch(error => {
      api.disconnect()

      throw error
    })
  })
}
