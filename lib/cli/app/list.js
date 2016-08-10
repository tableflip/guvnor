'use strict'

const config = require('../config')
const pkg = require('../../../package.json')
const Table = require('../process/Table')
const stringify = require('json-stringify-safe')

module.exports = (user, api, yargs) => {
  const argv = yargs
    .usage('Usage: $0 lsapps [options]')
    .demand(3)
    .example('$0 lsapps', 'List all installed apps')

    .describe('json', 'Output list in JSON format')
    .alias('j', 'json')
    .boolean('json')

    .describe('detail', 'Prints detailed app information')
    .alias('d', 'detail')
    .boolean('d')

    .help('h')
    .alias('h', 'help')

    .describe('verbose', 'Prints detailed internal logging output')
    .alias('v', 'verbose')
    .boolean('v')

    .epilog(`${config.DAEMON_NAME} v${pkg.version}`)
    .argv

  api.app.list((error, apps) => {
    if (error) {
      throw error
    }

    api.disconnect()

    if (argv.json) {
      return console.info(stringify(apps, null, 2))
    }

    if (argv.detail) {
      const table = new Table('No apps installed')
      table.addHeader(['Name', 'Version', 'User', 'Group', 'Ref', 'Type', 'Commit'])

      apps.forEach((app) => {
        table.addRow([app.name, app.version, app.user, app.group, app.ref.name, app.ref.type, app.ref.commit])
      })

      return table.print(console.info)
    }

    console.info(apps.map((app) => {
      return app.name
    }).join(' '))
  })
}
