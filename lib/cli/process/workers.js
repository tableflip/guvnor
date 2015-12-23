var pkg = require('../../../package.json')

module.exports = function workers (user, api, yargs) {
  var argv = yargs
    .usage('Usage: $0 workers [options] <script> <number>')
    .demand(5, 'Please specify a script and a number of workers')
    .example('$0 workers hello.js 3', 'Make hello.js have three cluster workers')

    .help('h')
    .alias('h', 'help')

    .describe('verbose', 'Prints detailed internal logging output')
    .alias('v', 'verbose')
    .boolean('v')

    .epilog('Guvnor v' + pkg.version)
    .argv

  var proc = argv._[3]
  var workers = argv._[4]

  api.process.workers(proc, workers, function (error) {
    if (error) {
      throw error
    }

    console.info('Process %s collected garbage', proc, workers)
    api.disconnect()
  })
}
