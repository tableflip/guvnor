var pkg = require('../../../package.json')
var logger = require('winston')
var each = require('../common/each')

module.exports = function remove (user, api, yargs) {
  var argv = yargs
    .usage('Usage: $0 rmapp [options] app1 app2...')
    .demand(4, 'Please specify an app to remove')
    .example('$0 rmapp my-app', 'Remove my-app')
    .example('$0 rmapp my-app my-other-app', 'Remove multiple apps')

    .help('h')
    .alias('h', 'help')

    .describe('verbose', 'Prints detailed internal logging output')
    .alias('v', 'verbose')
    .boolean('v')

    .epilog('Guvnor v' + pkg.version)
    .argv

  each(api, argv._.slice(3), function (api, name, done) {
    api.app.remove(name, function (error) {
      if (error) {
        logger.error(argv.verbose ? error : error.message)
      } else {
        console.info('Removed app %s', name)
      }

      done()
    })
  })
}
