'use strict'

const config = require('../config')
const pkg = require('../../../package.json')
const daemonRestConnection = require('../../common/daemon-rest-connection')

module.exports = (certs, piped, yargs) => {
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

  return new Promise((resolve, reject) => {
    const wreck = daemonRestConnection(certs)

    wreck.request({
      method: 'GET',
      path: '/'
    }, (error) => {
      if (error) {
        if (error.code === 'ECONNREFUSED') {
          return resolve('Daemon is not running')
        }

        return reject(error)
      }

      return resolve('Daemon is running')
    })
  })
}
