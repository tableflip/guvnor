'use strict'

const config = require('../config')
const pkg = require('../../../package.json')
const loadApi = require('../load-api')

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

  const name = argv._[3]

  return loadApi(certs, {
    404: `No process found for ${name}`,
    409: `${name} is not running`
  }, api => api.process.takeHeapSnapshot(name).then(snapshots => `Process ${name} took a heap snapshot at paths:\n${snapshots.map(snapshot => `${snapshot.path}\n`)}`))
}
