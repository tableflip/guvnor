'use strict'

const config = require('../config')
const pkg = require('../../../package.json')
const loadApi = require('../../local/api')

module.exports = (certs, piped, yargs) => {
  const argv = yargs
    .usage('Usage: $0 app set-ref [options] <app> <ref>')
    .demand(5, 'Please specify an app and a valid ref')
    .example('$0 app set-ref my-app master', 'Check out the master branch of my-app')
    .example('$0 app set-ref my-app new-feature', 'Check out the new-feature branch of my-app')

    .help('h')
    .alias('h', 'help')

    .describe('verbose', 'Prints detailed internal logging output')
    .alias('v', 'verbose')
    .boolean('v')

    .option('_', {
      type: 'string'
    })

    .epilog(`${config.DAEMON_NAME} v${pkg.version}`)
    .argv

  const name = argv._[3]
  const ref = argv._[4]

  return loadApi(certs)
  .then(api => {
    return api.app.setRef(name, ref, console.info)
    .then(() => {
      api.disconnect()

      return `Set ${name} ref to ${ref}`
    })
    .catch(error => {
      api.disconnect()

      throw error
    })
  })
}
