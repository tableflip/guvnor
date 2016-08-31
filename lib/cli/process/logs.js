'use strict'

const config = require('../config')
const pkg = require('../../../package.json')
const loadApi = require('../../local/api')

module.exports = (certs, piped, yargs) => {
  const argv = yargs
    .usage('Usage: $0 logs [options] <script>')
    .demand(4)
    .example('$0 logs hello-world.js', 'Print logs for hello-world.js')
    .example('$0 logs -f hello-world.js', 'Continously print logs for hello-world.js')
    .example('$0 list | $0 logs -f', 'Continously print logs for all processes')

    .describe('follow', 'Whether to print logs as they come in')
    .alias('f', 'follow')
    .boolean('f')

    .help('h')
    .alias('h', 'help')

    .describe('verbose', 'Prints detailed internal logging output')
    .alias('v', 'verbose')
    .boolean('v')

    .epilog(`${config.DAEMON_NAME} v${pkg.version}`)
    .argv

  const procName = argv._[3]

  return loadApi(certs)
  .then(api => {
    if (argv.follow) {
      api.on('process:log', function (proc, log) {
        if (proc.name !== procName) {
          return
        }

        console.info(log)
      })

      return
    }

    return api.process.logs(procName)
    .then(() => {
      api.disconnect()

      return `Process logs for ${procName}`
    })
    .catch(error => {
      api.disconnect()

      throw error
    })
  })
}
