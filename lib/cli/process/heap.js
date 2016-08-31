'use strict'

const config = require('../config')
const pkg = require('../../../package.json')
const loadApi = require('../../local/api')

module.exports = (certs, piped, yargs) => {
  const argv = yargs
    .usage('Usage: $0 heap [options] <script>')
    .demand(4)
    .example('$0 heap hello.js', 'Force a process to take a heap snapshot')

    .help('h')
    .alias('h', 'help')

    .describe('verbose', 'Prints detailed internal logging output')
    .alias('v', 'verbose')
    .boolean('v')

    .epilog(`${config.DAEMON_NAME} v${pkg.version}`)
    .argv

  const proc = argv._[3]

  return loadApi(certs)
  .then(api => {
    return api.process.takeHeapSnapshot(proc)
    .then(snapshot => {
      api.disconnect()

      return `Process ${proc} took a heap snapshot ${snapshot.path}`
    })
    .catch(error => {
      api.disconnect()

      throw error
    })
  })
}
