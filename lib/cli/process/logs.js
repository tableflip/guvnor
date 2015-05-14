var pkg = require('../../../package.json')

module.exports = function logs (user, api, yargs) {
  var argv = yargs
    .usage('Usage: $0 logs [options] <script>')
    .demand(4)
    .example('$0 logs hello.js', 'Print process logs')

    .help('h')
    .alias('h', 'help')

    .describe('verbose', 'Prints detailed internal logging output')
    .alias('v', 'verbose')
    .boolean('v')

    .epilog('Guvnor v' + pkg.version)
    .argv

  var proc = argv._[3]

  api.process.logs(proc, function (error) {
    if (error) {
      throw error
    }

    console.info('Process %s logs', proc)
    api.disconnect()
  })
}
