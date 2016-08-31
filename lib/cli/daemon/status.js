'use strict'

const config = require('../config')
const pkg = require('../../../package.json')
const daemonRestConnection = require('../../common/daemon-rest-connection')

module.exports = (user, api, yargs) => {
  yargs
    .usage('Usage: $0 status [options]')
    .demand(3)
    .example('$0 status', 'Find out if the daemon is running')

    .help('h')
    .alias('h', 'help')

    .describe('verbose', 'Prints detailed internal logging output')
    .alias('v', 'verbose')
    .boolean('v')

    .epilog(`${config.DAEMON_NAME} v${pkg.version}`)

  const wreck = daemonRestConnection(user.keyBundle)

  wreck.request({
    method: 'GET',
    path: '/'
  }, (error, response) => {
    if (error) {
      if (error.code === 'ECONNREFUSED') {
        console.info('Daemon is not running')

        return
      }

      throw error
    }

    console.info('Daemon is running')
  })
}
