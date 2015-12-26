var pkg = require('../../../package.json')

module.exports = function logs (user, api, yargs) {
  var argv = yargs
    .usage('Usage: $0 logs [options] <script>')
    .demand(4)
    .example('$0 logs hello.js', 'Print process logs')
    .example('$0 logs -f hello.js', 'Continously prints process logs')

    .describe('follow', 'Whether to print logs as they come in')
    .alias('f', 'follow')
    .boolean('f')

    .help('h')
    .alias('h', 'help')

    .describe('verbose', 'Prints detailed internal logging output')
    .alias('v', 'verbose')
    .boolean('v')

    .epilog('Guvnor v' + pkg.version)
    .argv

  var proc = argv._[3]

  api.process.logs(proc, function (error, logs) {
    if (error) {
      throw error
    }

    api.disconnect()

    if (logs) {
      console.info(logs)
    } else {
      console.info('Log file for %s was empty', proc)
    }
  })
}
