'use strict'

const config = require('../config')
const pkg = require('../../../package.json')
const loadApi = require('../load-api')

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

  const name = argv._[3]

  return loadApi(certs, {
    404: `No process found for ${name}`
  }, api => {
    if (name) {
      return api.process.logs(name, argv.follow, console.info)
    } else {
      return api.logs(argv.follow, console.info)
    }
  })
}
