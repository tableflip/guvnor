'use strict'

const config = require('../config')
const pkg = require('../../../package.json')

module.exports = (user, api, yargs) => {
  const argv = yargs
    .usage('Usage: $0 gc [options] <script>')
    .demand(4, 'Please specify a process')
    .example('$0 gc hello.js', 'Force a process to garbage collect')

    .help('h')
    .alias('h', 'help')

    .describe('verbose', 'Prints detailed internal logging output')
    .alias('v', 'verbose')
    .boolean('v')

    .epilog(`${config.DAEMON_NAME} v${pkg.version}`)
    .argv

  const proc = argv._[3]

  api.process.gc(proc, (error) => {
    if (error) {
      throw error
    }

    console.info(`Process ${proc} collected garbage`)

    api.disconnect()
  })
}
