var pkg = require('../../../package.json')
var each = require('../common/each')

module.exports = function restart (user, api, yargs) {
  var argv = yargs
    .usage('Usage: $0 restart [options] <script>')
    .demand(4, 'Please specify a process to restart.')
    .example('$0 restart hello.js', 'Restart a script')

    .help('h')
    .alias('h', 'help')

    .describe('verbose', 'Prints detailed internal logging output')
    .alias('v', 'verbose')
    .boolean('v')

    .epilog('Guvnor v' + pkg.version)
    .argv

  each(api, argv._.slice(3), function (api, name, done) {
    api.process.stop(name, function (error) {
      if (error) {
        throw error
      }

      console.info('Process %s stopped', name)

      api.process.start(name, {}, function (error, proc) {
        if (error) {
          throw error
        }

        console.info('Process %s started', proc.name)
        api.disconnect()
      })
    })
  })
}
