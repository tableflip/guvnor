var util = require('util')
var config = require('../config')
var pkg = require('../../../package.json')

module.exports = function logs (user, api, yargs) {
  yargs
    .usage('Usage: $0 logs [options]')
    .demand(3)
    .example('$0 logs', 'Show logs for all managed processes')

    .help('h')
    .alias('h', 'help')

    .describe('verbose', 'Prints detailed internal logging output')
    .alias('v', 'verbose')
    .boolean('v')

    .epilog(util.format('%s v%s', config.DAEMON_NAME, pkg.version))
    .argv

  api.daemon.logs(function (error) {
    if (error) {
      throw error
    }

    console.info('All logs')
    api.disconnect()
  })
}
