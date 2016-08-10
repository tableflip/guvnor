'use strict'

const config = require('../config')
const pkg = require('../../../package.json')

module.exports = (user, api, yargs) => {
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

  api.daemon.logs((error) => {
    if (error) {
      throw error
    }

    console.info('All logs')
    api.disconnect()
  })
}
