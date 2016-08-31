'use strict'

const config = require('../config')
const pkg = require('../../../package.json')
const logger = require('winston')
const loadApi = require('../../local/api')

module.exports = (certs, piped, yargs) => {
  const argv = yargs
    .usage('Usage: $0 kill [options]')
    .demand(3)
    .example('$0 kill', 'Stop the daemon and all managed processes')

    .help('h')
    .alias('h', 'help')

    .describe('verbose', 'Prints detailed internal logging output')
    .alias('v', 'verbose')
    .boolean('v')

    .epilog(`${config.DAEMON_NAME} v${pkg.version}`)
    .argv

  if (argv._.length > 3) {
    logger.warn('You appear to have specified arguments to \'guv kill\'.')
    logger.warn(`Did you really mean 'guv kill ${argv._[3]}'?`)
    logger.warn('Cowardly refusing to run...')

    process.exit(0)
  }

  return loadApi(certs)
  .then(api => {
    return api.daemon.kill()
    .then(() => {
      api.disconnect()

      return 'Daemon stopped'
    })
    .catch(error => {
      api.disconnect()

      throw error
    })
  })
}
