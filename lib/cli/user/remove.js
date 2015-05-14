var pkg = require('../../../package.json')

module.exports = function removeUser (user, api, yargs) {
  var argv = yargs
    .usage('Usage: $0 user remove [options] <name>')
    .demand(4, 'Please specify a user to remove')
    .example('$0 user add ' + user.name, 'Add a user named ' + user.name)

    .help('h')
    .alias('h', 'help')

    .describe('verbose', 'Prints detailed internal logging output')
    .alias('v', 'verbose')
    .boolean('v')

    .epilog('Guvnor v' + pkg.version)
    .argv

  var userName = argv._[3]

  api.user.remove(userName, function (error) {
    if (error) {
      throw error
    }

    console.info('User %s removed', userName)
    api.disconnect()
  })
}
