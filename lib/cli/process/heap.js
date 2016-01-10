var util = require('util')
var config = require('../config')
var pkg = require('../../../package.json')

module.exports = function heap (user, api, yargs) {
  var argv = yargs
    .usage('Usage: $0 heap [options] <script>')
    .demand(4)
    .example('$0 heap hello.js', 'Force a process to take a heap snapshot')

    .help('h')
    .alias('h', 'help')

    .describe('verbose', 'Prints detailed internal logging output')
    .alias('v', 'verbose')
    .boolean('v')

    .epilog(util.format('%s v%s', config.DAEMON_NAME, pkg.version))
    .argv

  var proc = argv._[3]

  api.process.takeHeapSnapshot(proc, function (error, snapshot) {
    if (error) {
      throw error
    }

    console.info('Process %s took a heap snapshot %s', proc, snapshot.path)
    api.disconnect()
  })
}
