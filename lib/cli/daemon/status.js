var util = require('util')
var config = require('../config')
var pkg = require('../../../package.json')
var logger = require('winston')
var wreck = require('wreck')
var daemonRestConnection = require('../../common/daemon-rest-connection')

module.exports = function status (user, api, yargs) {
  var argv = yargs
    .usage('Usage: $0 status [options]')
    .demand(3)
    .example('$0 status', 'Find out if the daemon is running')

    .help('h')
    .alias('h', 'help')

    .describe('verbose', 'Prints detailed internal logging output')
    .alias('v', 'verbose')
    .boolean('v')

    .epilog(util.format('%s v%s', config.DAEMON_NAME, pkg.version))
    .argv

  var wreck = daemonRestConnection(user.keyBundle)

  wreck.request({
    method: 'GET',
    path: '/certificates/ca'
  }, function (error, response) {
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
