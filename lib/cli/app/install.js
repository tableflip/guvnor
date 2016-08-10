'use strict'

const pkg = require('../../../package.json')
const config = require('../config')

module.exports = (user, api, yargs) => {
  const argv = yargs
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

    .epilog(`${config.DAEMON_NAME} v${pkg.version}`)
    .argv

  const url = argv._[3]

  api.app.install(url, argv.name, console.info, (error, app) => {
    if (error) {
      throw error
    }

    console.info(`Installed ${app.name} from ${url}`)

    api.disconnect()
  })
}
