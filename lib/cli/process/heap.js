'use strict'

const config = require('../config')
const pkg = require('../../../package.json')

module.exports = function heap (user, api, yargs) {
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

  api.process.takeHeapSnapshot(proc, function (error, snapshot) {
    if (error) {
      throw error
    }

    console.info(`Process ${proc} took a heap snapshot ${snapshot.path}`)

    api.disconnect()
  })
}
