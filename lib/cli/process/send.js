var util = require('util')
var config = require('../config')
var pkg = require('../../../package.json')

module.exports = function send (user, api, yargs) {
  var argv = yargs
    .usage('Usage: $0 send [options] <script> ...')
    .demand(5, 'Please specify a process and an event')
    .example('$0 send hello.js event:name arg1 arg2 arg3', 'Send a message to a process - will be emitted by the process object')

    .help('h')
    .alias('h', 'help')

    .describe('verbose', 'Prints detailed internal logging output')
    .alias('v', 'verbose')
    .boolean('v')

    .epilog(util.format('%s v%s', config.DAEMON_NAME, pkg.version))
    .argv

  var proc = argv._[3]
  var event = argv._[4]
  var args = argv._.slice(5)

  api.process.send(proc, event, args, function (error) {
    if (error) {
      throw error
    }

    console.info('Sent %s event to process %s', event, proc)
    api.disconnect()
  })
}
