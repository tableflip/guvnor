'use strict'

const config = require('../config')
const pkg = require('../../../package.json')
const each = require('../common/each')

module.exports = (user, api, yargs) => {
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

  each(api, argv._.slice(3), (api, name, done) => {
    api.process.stop(name, (error) => {
      if (error) {
        throw error
      }

      console.info(`Process ${name} stopped`)

      api.process.start(name, {}, (error, proc) => {
        if (error) {
          throw error
        }

        console.info(`Process ${proc.name} started`)

        api.disconnect()
      })
    })
  })
}
