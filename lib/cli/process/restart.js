'use strict'

const config = require('../config')
const pkg = require('../../../package.json')
const loadApi = require('../../local/api')

module.exports = (certs, piped, yargs) => {
  const argv = yargs
    .usage('Usage: $0 restart [options] <script>')
    .demand(4, 'Please specify a process to restart.')
    .example('$0 restart hello.js', 'Restart a script')

    .help('h')
    .alias('h', 'help')

    .describe('verbose', 'Prints detailed internal logging output')
    .alias('v', 'verbose')
    .boolean('v')

    .epilog(`${config.DAEMON_NAME} v${pkg.version}`)
    .argv

  const name = argv._[3]

  return loadApi(certs)
  .then(api => {
    return api.process.stop(name)
    .then(() => api.process.start(name))
    .then(() => {
      api.disconnect()

      return `Process ${name} restarted`
    })
    .catch(error => {
      api.disconnect()

      throw error
    })
  })
}
