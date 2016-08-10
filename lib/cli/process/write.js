'use strict'

const config = require('../config')
const pkg = require('../../../package.json')

module.exports = function write (user, api, yargs) {
  const argv = yargs
    .usage('Usage: $0 write [options] <script> <string>')
    .demand(5, 'Please specify a script and a string')
    .example('$0 write hello.js "hello world"', 'Write to stdin of a process')

    .help('h')
    .alias('h', 'help')

    .describe('verbose', 'Prints detailed internal logging output')
    .alias('v', 'verbose')
    .boolean('v')

    .epilog(`${config.DAEMON_NAME} v${pkg.version}`)
    .argv

  const proc = argv._[3]
  const string = argv._[4]

  api.process.write(proc, string, function (error) {
    if (error) {
      throw error
    }

    console.info(`Wrote ${string} to stdin of process ${proc}`)

    api.disconnect()
  })
}
