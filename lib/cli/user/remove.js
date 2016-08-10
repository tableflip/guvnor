'use strict'

const config = require('../config')
const pkg = require('../../../package.json')

module.exports = (user, api, yargs) => {
  const argv = yargs
    .usage('Usage: $0 user remove [options] <name>')
    .demand(4, 'Please specify a user to remove')
    .example(`$0 user remove ${user.name}`, `Remove a user named ${user.name}`)

    .help('h')
    .alias('h', 'help')

    .describe('verbose', 'Prints detailed internal logging output')
    .alias('v', 'verbose')
    .boolean('v')

    .epilog(`${config.DAEMON_NAME} v${pkg.version}`)
    .argv

  const userName = argv._[3]

  api.user.remove(userName, (error) => {
    if (error) {
      throw error
    }

    console.info(`User ${userName} removed`)

    api.disconnect()
  })
}
