'use strict'

const config = require('../config')
const pkg = require('../../../package.json')

module.exports = (user, api, yargs) => {
  const argv = yargs
    .usage('Usage: $0 signal [options] <script> <signal>')
    .demand(5, 'Please specify a script and a signal')
    .example('$0 signal hello.js SIGINT', 'Send the SIGINT signal to a process')

    .help('h')
    .alias('h', 'help')

    .describe('verbose', 'Prints detailed internal logging output')
    .alias('v', 'verbose')
    .boolean('v')

    .epilog(`${config.DAEMON_NAME} v${pkg.version}`)
    .argv

  const proc = argv._[3]
  const signal = argv._[4]

  api.process.signal(proc, signal, (error) => {
    if (error) {
      throw error
    }

    console.info(`Sent ${signal} signal to process ${proc}`)

    api.disconnect()
  })
}
