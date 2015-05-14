var pkg = require('../../../package.json')

module.exports = function start (user, api, yargs) {
  var argv = yargs
    .usage('Usage: $0 app install [options] <url>')
    .demand(4, 'Please specify a URL to a git repository')
    .example('$0 app install https://github.com/user/project.git', 'Install an app from a public git repository')

    .help('h')
    .alias('h', 'help')

    .describe('verbose', 'Prints detailed internal logging output')
    .alias('v', 'verbose')
    .boolean('v')

    .describe('name', 'Override the name field from package.json')
    .alias('n', 'name')

    .epilog('Guvnor v' + pkg.version)
    .argv

  var url = argv._[3]

  api.app.install(url, argv.name, console.info, function (error, app) {
    if (error) {
      throw error
    }

    console.info('Installed %s from %s', app.name, url)

    api.disconnect()
  })
}
