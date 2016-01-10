var util = require('util')
var config = require('../config')
var pkg = require('../../../package.json')

module.exports = function gc (user, api, yargs) {
  var argv = yargs
    .usage('Usage: $0 gc [options] <script>')
    .demand(4, 'Please specify a process')
    .example('$0 gc hello.js', 'Force a process to garbage collect')

    .help('h')
    .alias('h', 'help')

    .describe('verbose', 'Prints detailed internal logging output')
    .alias('v', 'verbose')
    .boolean('v')

    .epilog(util.format('%s v%s', config.DAEMON_NAME, pkg.version))
    .argv

  var proc = argv._[3]

  api.process.gc(proc, function (error) {
    if (error) {
      throw error
    }

    console.info('Process %s collected garbage', proc)
    api.disconnect()
  })
}
