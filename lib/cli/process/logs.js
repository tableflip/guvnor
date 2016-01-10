var util = require('util')
var config = require('../config')
var pkg = require('../../../package.json')

module.exports = function logs (user, api, yargs) {
  var argv = yargs
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

    .epilog(util.format('%s v%s', config.DAEMON_NAME, pkg.version))
    .argv

  var procName = argv._[3]

  if (argv.follow) {
    api.on('process:log', function (proc, log) {
      if (proc.name !== procName) {
        return
      }

      console.info(log)
    })

    return
  }

  api.process.logs(procName, function (error, logs) {
    if (error) {
      throw error
    }

    api.disconnect()

    if (logs) {
      console.info(logs)
    } else {
      console.info('Log file for %s was empty', proc)
    }
  })
}
