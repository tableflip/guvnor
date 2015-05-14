var pkg = require('../../../package.json')

module.exports = function addUser (user, api, yargs) {
  var argv = yargs
    .usage('Usage: $0 user add [options] <name>')
    .demand(4, 'Please specify a user to add')
    .example('$0 user add ' + user.name, 'Add a user named ' + user.name)

    .help('h')
    .alias('h', 'help')

    .describe('verbose', 'Prints detailed internal logging output')
    .alias('v', 'verbose')
    .boolean('v')

    .epilog('Guvnor v' + pkg.version)
    .argv

  var userName = argv._[3]

  api.user.add(userName, function (error) {
    if (error) {
      throw error
    }

    console.info('User %s added', userName)
    api.disconnect()
  })
}
