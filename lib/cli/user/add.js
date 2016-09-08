'use strict'

const config = require('../config')
const pkg = require('../../../package.json')
const api = require('../api')

module.exports = (certs, piped, yargs) => {
  const argv = yargs
    .usage('Usage: $0 useradd [options] <name>')
    .demand(4, 'Please specify a user to add')
    .example('$0 user add bob', 'Add a user named bob')

    .help('h')
    .alias('h', 'help')

    .describe('verbose', 'Prints detailed internal logging output')
    .alias('v', 'verbose')
    .boolean('v')

    .epilog(`${config.DAEMON_NAME} v${pkg.version}`)
    .argv

  const userName = argv._[3]

  return api(certs, {
    409: `A certificate already exists for that user, please remove it with 'guv user rm ${userName}' first`,
    404: `No user was found with the name ${userName}`
  }, api => api.user.add(userName)
    .then(() => `User ${userName} added`)
  )
}
