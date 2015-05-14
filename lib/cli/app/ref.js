var pkg = require('../../../package.json')
var Table = require('../process/Table')
var stringify = require('json-stringify-safe')

module.exports = function refs (user, api, yargs) {
  var argv = yargs
    .usage('Usage: $0 app refs [options] <app>')
    .demand(4, 'Please specify an app to list the refs of')
    .example('$0 app refs my-app', 'List available refs for my-app')

    .describe('json', 'Output list in JSON format')
    .alias('j', 'json')
    .boolean('json')

    .describe('detail', 'Prints detailed app ref information')
    .alias('d', 'detail')
    .boolean('d')

    .help('h')
    .alias('h', 'help')

    .describe('verbose', 'Prints detailed internal logging output')
    .alias('v', 'verbose')
    .boolean('v')

    .epilog('Guvnor v' + pkg.version)
    .argv

  var name = argv._[3]

  api.app.ref(name, function (error, ref) {
    if (error) {
      throw error
    }

    api.disconnect()

    if (argv.json) {
      return console.info(stringify(ref))
    }

    if (argv.detail) {
      var table = new Table('No ref')
      table.addHeader(['Name', 'Commit', 'Type'])

      table.addRow([ref.name, ref.commit, ref.type])

      return table.print(console.info)
    }

    console.info(ref.name)
  })
}
