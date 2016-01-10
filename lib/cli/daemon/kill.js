var util = require('util')
var config = require('../config')
var pkg = require('../../../package.json')
var logger = require('winston')

module.exports = function kill (user, api, yargs) {
  var argv = yargs
    .usage('Usage: $0 kill [options]')
    .demand(3)
    .example('$0 kill', 'Stop the daemon and all managed processes')

    .help('h')
    .alias('h', 'help')

    .describe('verbose', 'Prints detailed internal logging output')
    .alias('v', 'verbose')
    .boolean('v')

    .epilog(util.format('%s v%s', config.DAEMON_NAME, pkg.version))
    .argv

  if (argv._.length > 3) {
    logger.warn('You appear to have specified arguments to `guv kill`.')
    logger.warn('Did you really mean `guv kill ' + argv._[3] + '`?')
    logger.warn('Cowardly refusing to run...')

    process.exit(0)
  }

  api.daemon.kill(function (error) {
    if (error) {
      throw error
    }

    console.info('Daemon stopped')
    api.disconnect()
  })
}
