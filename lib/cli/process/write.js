var pkg = require('../../../package.json')

module.exports = function write (user, api, yargs) {
  var argv = yargs
    .usage('Usage: $0 write [options] <script> <string>')
    .demand(5, 'Please specify a script and a string')
    .example('$0 write hello.js "hello world"', 'Write to stdin of a process')

    .help('h')
    .alias('h', 'help')

    .describe('verbose', 'Prints detailed internal logging output')
    .alias('v', 'verbose')
    .boolean('v')

    .epilog('Guvnor v' + pkg.version)
    .argv

  var proc = argv._[3]
  var string = argv._[4]

  api.process.write(proc, string, function (error) {
    if (error) {
      throw error
    }

    console.info('Wrote %s to stdin of process %s', string, proc)
    api.disconnect()
  })
}
