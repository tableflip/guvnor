var util = require('util')
var config = require('../config')
var pkg = require('../../../package.json')
var each = require('../common/each')
var logger = require('winston')

module.exports = function stop (user, api, yargs) {
  var argv = yargs
    .usage('Usage: $0 stop [options] <script>')
    .demand(4, 'Please specify a process to stop.')
    .example('$0 stop hello.js', 'Stop a script')

    .help('h')
    .alias('h', 'help')

    .describe('verbose', 'Prints detailed internal logging output')
    .alias('v', 'verbose')
    .boolean('v')

    .epilog(util.format('%s v%s', config.DAEMON_NAME, pkg.version))
    .argv

  each(api, argv._.slice(3), function (api, name, done) {
    api.process.stop(name, function (error) {
      if (error) {
        logger.error(argv.verbose ? error : error.message)
      } else {
        console.info('Process %s stopped', name)
      }

      done()
    })
  })
}
