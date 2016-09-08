'use strict'

const config = require('../config')
const pkg = require('../../../package.json')
const loadApi = require('../load-api')

module.exports = (certs, piped, yargs) => {
  const argv = yargs
    .usage('Usage: $0 remove [options] <script>')
    .demand(4)
    .example('$0 remove hello.js', 'Remove a script')

    .help('h')
    .alias('h', 'help')

    .describe('verbose', 'Prints detailed internal logging output')
    .alias('v', 'verbose')
    .boolean('v')

    .epilog(`${config.DAEMON_NAME} v${pkg.version}`)
    .argv

  let name = argv._[3]

  return loadApi(certs, {
    404: `No process found for ${name}`
  }, api => api.process.remove(name).then(() => `Process ${name} removed`))
}
