'use strict'

const config = require('../config')
const pkg = require('../../../package.json')
const loadApi = require('../../local/api')

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

  return loadApi(certs)
  .then(api => {
    return api.process.remove(name)
    .then(() => {
      api.disconnect()

      return `Process ${name} removed`
    })
    .catch(error => {
      api.disconnect()

      throw error
    })
  })
}
