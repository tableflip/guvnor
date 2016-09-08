'use strict'

const config = require('../config')
const pkg = require('../../../package.json')
const loadApi = require('../load-api')

module.exports = (certs, piped, yargs) => {
  const argv = yargs
    .usage('Usage: $0 stop [options] <script>')
    .demand(4, 'Please specify a process to stop.')
    .example('$0 stop hello.js', 'Stop a script')

    .help('h')
    .alias('h', 'help')

    .describe('verbose', 'Prints detailed internal logging output')
    .alias('v', 'verbose')
    .boolean('v')

    .epilog(`${config.DAEMON_NAME} v${pkg.version}`)
    .argv

  let name = argv._[3]

  return loadApi(certs, {
    409: `${name} is not running`
  }, api => api.process.stop(name).then(() => `Process ${name} stopped`))
}
