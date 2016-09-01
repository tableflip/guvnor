'use strict'

const config = require('../config')
const pkg = require('../../../package.json')
const loadApi = require('../../local/api')

module.exports = (certs, piped, yargs) => {
  const argv = yargs
    .usage('Usage: $0 send [options] <script> ...')
    .demand(5, 'Please specify a process and an event')
    .example('$0 send hello.js event:name arg1 arg2 arg3', 'Send a message to a process - will be emitted by the process object')

    .describe('worker', 'Which worker to send the event to')
    .alias('w', 'worker')

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

  return loadApi(certs)
  .then(api => {
    return api.process.sendEvent(proc, event, args, argv.worker)
    .then(() => {
      api.disconnect()

      return `Sent ${event} event to process ${proc}`
    })
    .catch(error => {
      api.disconnect()

      throw error
    })
  })
}
