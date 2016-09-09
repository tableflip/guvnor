'use strict'

const config = require('../config')
const pkg = require('../../../package.json')
const Table = require('../process/Table')
const stringify = require('json-stringify-safe')
const loadApi = require('../load-api')

module.exports = (certs, piped, yargs) => {
  const argv = yargs
    .usage('Usage: $0 lsrefs [options] <app>')
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

    .epilog(`${config.DAEMON_NAME} v${pkg.version}`)
    .argv

  const name = argv._[3]

  return loadApi(certs, {
    404: `No app found for ${name}`
  }, api => api.app.refs(name).then(refs => {
    if (argv.json) {
      return stringify(refs)
    }

    if (piped) {
      return refs.map((ref) => {
        return ref.name
      }).join(' ')
    }

    const table = new Table('No refs')
    table.addHeader(['Name', 'Commit', 'Type'])

    refs.forEach((ref) => {
      table.addRow([ref.name, ref.commit, ref.type])
    })

    return table.toString()
  }))
}
