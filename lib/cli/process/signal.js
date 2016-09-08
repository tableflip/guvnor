'use strict'

const config = require('../config')
const pkg = require('../../../package.json')
const loadApi = require('../load-api')

module.exports = (certs, piped, yargs) => {
  const argv = yargs
    .usage('Usage: $0 signal [options] <script> <signal>')
    .demand(5, 'Please specify a script and a signal')
    .example('$0 signal hello.js SIGINT', 'Send the SIGINT signal to a process')

    .describe('worker', 'Which worker to send the signal to')
    .alias('w', 'worker')

    .help('h')
    .alias('h', 'help')

    .describe('verbose', 'Prints detailed internal logging output')
    .alias('v', 'verbose')
    .boolean('v')

    .epilog(`${config.DAEMON_NAME} v${pkg.version}`)
    .argv

  const name = argv._[3]
  const signal = argv._[4]

  return loadApi(certs, {
    404: `No process found for ${name}`,
    409: `${name} is not running`
  }, api => api.process.sendSignal(name, signal, argv.worker).then(() => `Sent ${signal} signal to process ${name}`))
}
