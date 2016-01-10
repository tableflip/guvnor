var util = require('util')
var config = require('../config')
var pkg = require('../../../package.json')

module.exports = function signal (user, api, yargs) {
  var argv = yargs
    .usage('Usage: $0 signal [options] <script> <signal>')
    .demand(5, 'Please specify a script and a signal')
    .example('$0 signal hello.js SIGINT', 'Send the SIGINT signal to a process')

    .help('h')
    .alias('h', 'help')

    .describe('verbose', 'Prints detailed internal logging output')
    .alias('v', 'verbose')
    .boolean('v')

    .epilog(util.format('%s v%s', config.DAEMON_NAME, pkg.version))
    .argv

  var proc = argv._[3]
  var signal = argv._[4]

  api.process.signal(proc, signal, function (error) {
    if (error) {
      throw error
    }

    console.info('Sent %s signal to process %s', signal, proc)
    api.disconnect()
  })
}
