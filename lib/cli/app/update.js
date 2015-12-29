var pkg = require('../../../package.json')

module.exports = (user, api, yargs) => {
  var argv = yargs
    .usage('Usage: $0 app udpate [options] <app>')
    .demand(4, 'Please specify an app to update')
    .example('$0 app update my-app', 'Updates all refs for my-app')

    .help('h')
    .alias('h', 'help')

    .describe('verbose', 'Prints detailed internal logging output')
    .alias('v', 'verbose')
    .boolean('v')

    .epilog('Guvnor v' + pkg.version)
    .argv

  var name = argv._[3]

  api.app.update(name, console.info, (error, app) => {
    if (error) {
      throw error
    }

    console.info('Updated %s', app.name)

    api.disconnect()
  })
}
