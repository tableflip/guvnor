'use strict'

const config = require('../config')
const pkg = require('../../../package.json')

module.exports = function send (user, api, yargs) {
  const argv = yargs
    .usage('Usage: $0 send [options] <script> ...')
    .demand(5, 'Please specify a process and an event')
    .example('$0 send hello.js event:name arg1 arg2 arg3', 'Send a message to a process - will be emitted by the process object')

    .help('h')
    .alias('h', 'help')

    .describe('verbose', 'Prints detailed internal logging output')
    .alias('v', 'verbose')
    .boolean('v')

    .epilog(`${config.DAEMON_NAME} v${pkg.version}`)
    .argv

  const proc = argv._[3]
  const event = argv._[4]
  const args = argv._.slice(5)

  api.process.send(proc, event, args, function (error) {
    if (error) {
      throw error
    }

    console.info(`Sent ${event} event to process ${proc}`)

    api.disconnect()
  })
}
